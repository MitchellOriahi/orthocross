ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS friend_notifications_processed_at timestamptz;

CREATE TABLE public.friend_donation_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL,
  donor_id uuid NOT NULL,
  donor_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  push_sent_at timestamptz,
  UNIQUE (donation_id, recipient_id)
);
GRANT SELECT, UPDATE ON public.friend_donation_notifications TO authenticated;
GRANT ALL ON public.friend_donation_notifications TO service_role;
REVOKE UPDATE ON public.friend_donation_notifications FROM authenticated;
GRANT UPDATE (read_at) ON public.friend_donation_notifications TO authenticated;
ALTER TABLE public.friend_donation_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipients read public donations from current friends"
ON public.friend_donation_notifications FOR SELECT TO authenticated USING (
  recipient_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = donor_id AND p.donor_anonymous = false)
  AND EXISTS (SELECT 1 FROM public.friends f WHERE (f.user_id = auth.uid() AND f.friend_id = donor_id) OR (f.friend_id = auth.uid() AND f.user_id = donor_id))
  AND NOT public.is_user_blocked(auth.uid(), donor_id)
);
CREATE POLICY "Recipients mark their own alerts read"
ON public.friend_donation_notifications FOR UPDATE TO authenticated
USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_donation_notifications;

CREATE OR REPLACE FUNCTION public.queue_friend_donation_notifications(p_donation_id uuid)
RETURNS SETOF public.friend_donation_notifications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  d public.donations%ROWTYPE;
  p public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO d FROM public.donations WHERE id = p_donation_id FOR UPDATE;
  IF NOT FOUND OR d.status <> 'confirmed' OR d.amount <= COALESCE(d.refunded_amount, 0) THEN RETURN; END IF;
  SELECT * INTO p FROM public.profiles WHERE id = d.user_id;
  IF d.friend_notifications_processed_at IS NULL THEN
    UPDATE public.donations SET friend_notifications_processed_at = now() WHERE id = d.id;
    IF p.donor_anonymous = false THEN
      INSERT INTO public.friend_donation_notifications (donation_id, recipient_id, donor_id, donor_name)
      SELECT d.id, fp.id, d.user_id, COALESCE(NULLIF(trim(p.display_name), ''), NULLIF(trim(p.username), ''), 'A friend')
      FROM public.profiles fp
      WHERE fp.id <> d.user_id
        AND fp.friends_notifications_enabled IS DISTINCT FROM false
        AND EXISTS (SELECT 1 FROM public.friends f WHERE (f.user_id = d.user_id AND f.friend_id = fp.id) OR (f.friend_id = d.user_id AND f.user_id = fp.id))
        AND NOT public.is_user_blocked(d.user_id, fp.id)
      ON CONFLICT (donation_id, recipient_id) DO NOTHING;
    END IF;
  END IF;
  RETURN QUERY SELECT n.* FROM public.friend_donation_notifications n
    JOIN public.profiles recipient ON recipient.id = n.recipient_id
    WHERE n.donation_id = d.id AND n.push_sent_at IS NULL
      AND p.donor_anonymous = false
      AND recipient.friends_notifications_enabled IS DISTINCT FROM false
      AND EXISTS (SELECT 1 FROM public.friends f WHERE (f.user_id = d.user_id AND f.friend_id = n.recipient_id) OR (f.friend_id = d.user_id AND f.user_id = n.recipient_id))
      AND NOT public.is_user_blocked(d.user_id, n.recipient_id);
END;
$$;
REVOKE ALL ON FUNCTION public.queue_friend_donation_notifications(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_friend_donation_notifications(uuid) TO service_role;