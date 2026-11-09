-- Ports Lovable's drizzle migrations 0016-0019 (friend profile card, age minimum 4,
-- widget tokens + calendar preferences, Oriental calendar family). All idempotent.

-- ===== drizzle 0016_friend_profile_card =====
CREATE OR REPLACE FUNCTION public.get_friend_profile_card(p_user_id uuid)
RETURNS TABLE(branch text, patron_saint_id text, country_code text, age smallint, donation_count integer, lifetime_cents integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH allowed AS (
    SELECT 1 AS ok WHERE auth.uid() IS NOT NULL AND (
      auth.uid() = p_user_id OR EXISTS (
        SELECT 1 FROM public.friends f
         WHERE (f.user_id = auth.uid() AND f.friend_id = p_user_id)
            OR (f.friend_id = auth.uid() AND f.user_id = p_user_id)))
  ), donor AS (
    SELECT CASE WHEN auth.uid() <> p_user_id AND COALESCE(p.donor_anonymous, false) THEN NULL ELSE count(d.id)::int END AS c,
           CASE WHEN auth.uid() <> p_user_id AND COALESCE(p.donor_anonymous, false) THEN NULL
                ELSE COALESCE(sum(GREATEST(0, d.amount - COALESCE(d.refunded_amount, 0))), 0)::int END AS cents
      FROM public.profiles p
      LEFT JOIN public.donations d ON d.user_id = p.id AND d.status = 'confirmed'
     WHERE p.id = p_user_id
     GROUP BY p.donor_anonymous
  )
  SELECT t.branch, t.patron_saint_id, t.country_code, t.age, donor.c, donor.cents
    FROM allowed
    CROSS JOIN donor
    LEFT JOIN public.profile_identity_tags t ON t.user_id = p_user_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_friend_profile_card(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_friend_profile_card(uuid) TO authenticated;

-- ===== drizzle 0017_lower_profile_age_minimum_to_4 =====
ALTER TABLE public.profile_identity_tags DROP CONSTRAINT IF EXISTS profile_identity_tags_age_check;
ALTER TABLE public.profile_identity_tags ADD CONSTRAINT profile_identity_tags_age_check CHECK (age IS NULL OR (age BETWEEN 4 AND 120));

-- ===== drizzle 0018_widget_data =====
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendar_system text NOT NULL DEFAULT 'Gregorian';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendar_tradition text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_calendar_system_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_calendar_system_check
      CHECK (calendar_system IN ('Gregorian', 'Julian'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_calendar_tradition_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_calendar_tradition_check
      CHECK (calendar_tradition IS NULL OR calendar_tradition IN ('Eastern Orthodox', 'Oriental Orthodox'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.widget_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT widget_tokens_label_length CHECK (label IS NULL OR char_length(label) <= 60)
);

CREATE INDEX IF NOT EXISTS widget_tokens_user_active_idx
  ON public.widget_tokens (user_id) WHERE revoked_at IS NULL;

REVOKE ALL ON public.widget_tokens FROM anon;
REVOKE ALL ON public.widget_tokens FROM authenticated;
GRANT SELECT (id, user_id, label, created_at, last_used_at, revoked_at) ON public.widget_tokens TO authenticated;
GRANT ALL ON public.widget_tokens TO service_role;

ALTER TABLE public.widget_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own widget connections" ON public.widget_tokens;
CREATE POLICY "Users can view their own widget connections"
  ON public.widget_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ===== drizzle 0019_calendar_oriental_family =====
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendar_oriental_family text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_calendar_oriental_family_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_calendar_oriental_family_check
      CHECK (calendar_oriental_family IS NULL OR calendar_oriental_family IN ('alexandrian', 'syriac', 'armenian'));
  END IF;
END $$;
