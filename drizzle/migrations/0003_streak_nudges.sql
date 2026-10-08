CREATE TABLE public.streak_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  nudge_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC')::date),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, receiver_id, nudge_date)
);
GRANT SELECT ON public.streak_nudges TO authenticated;
GRANT ALL ON public.streak_nudges TO service_role;
ALTER TABLE public.streak_nudges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Senders see their nudges" ON public.streak_nudges FOR SELECT TO authenticated USING (sender_id = auth.uid());