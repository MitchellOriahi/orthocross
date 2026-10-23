-- =============================================================================
-- lovable-parity.sql
-- Brings the NEW Supabase project (uceqydqvjapkobqwrbxw) to the schema that
-- Lovable's current code expects (drizzle/migrations/0000..0010 + gaps).
--
-- * Idempotent: safe to run more than once.
-- * Non-destructive: no DROP TABLE / DROP COLUMN / DELETE. Only DROP POLICY IF
--   EXISTS immediately followed by re-creating the same-named policy.
-- * Does NOT touch daily_verses, get_verse_of_the_day(), or
--   profiles.verse_notifications_enabled.
-- * Order matters: profiles.donor_anonymous and donations.* columns must exist
--   before friend_donation_notifications policies / function are created.
-- * Prereqs that already exist in the NEW db (from supabase/migrations):
--   public.has_role(uuid, app_role), public.is_group_admin(uuid, uuid),
--   public.is_user_blocked(uuid, uuid), public.update_updated_at_column(),
--   public.friends(user_id, friend_id), profiles.friends_notifications_enabled.
-- Review, then run in the SQL editor of the NEW project inside a transaction.
-- =============================================================================

BEGIN;

-- Sanity check: abort early if a prerequisite is missing.
DO $$
BEGIN
  IF to_regprocedure('public.has_role(uuid, public.app_role)') IS NULL THEN
    RAISE EXCEPTION 'missing prerequisite: public.has_role(uuid, app_role)'; END IF;
  IF to_regprocedure('public.is_group_admin(uuid, uuid)') IS NULL THEN
    RAISE EXCEPTION 'missing prerequisite: public.is_group_admin(uuid, uuid)'; END IF;
  IF to_regprocedure('public.is_user_blocked(uuid, uuid)') IS NULL THEN
    RAISE EXCEPTION 'missing prerequisite: public.is_user_blocked(uuid, uuid)'; END IF;
  IF to_regprocedure('public.update_updated_at_column()') IS NULL THEN
    RAISE EXCEPTION 'missing prerequisite: public.update_updated_at_column()'; END IF;
  IF to_regclass('public.friends') IS NULL THEN
    RAISE EXCEPTION 'missing prerequisite: public.friends'; END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Storage buckets (GAP: no drizzle file creates them; 0000/0001/0004 only add
-- policies). App code uses createSignedUrl() for both (IconTuner.tsx:53,
-- GroupDetail.tsx:105), so private buckets work. If the old project had them
-- public, flip `public` afterwards. ON CONFLICT leaves existing buckets as-is.
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('saint-icons', 'saint-icons', false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('group-avatars', 'group-avatars', false)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- drizzle/migrations/0000_saint_icon_overrides.sql
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saint_icon_overrides (
  saint_id text PRIMARY KEY,
  image_url text,
  image_source text,
  image_license text,
  image_attribution text,
  focus_x numeric NOT NULL DEFAULT 50,
  focus_y numeric NOT NULL DEFAULT 30,
  zoom numeric NOT NULL DEFAULT 1,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.saint_icon_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saint_icon_overrides TO authenticated;
GRANT ALL ON public.saint_icon_overrides TO service_role;
ALTER TABLE public.saint_icon_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read saint icon overrides" ON public.saint_icon_overrides;
CREATE POLICY "Anyone can read saint icon overrides" ON public.saint_icon_overrides
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins insert saint icon overrides" ON public.saint_icon_overrides;
CREATE POLICY "Admins insert saint icon overrides" ON public.saint_icon_overrides
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update saint icon overrides" ON public.saint_icon_overrides;
CREATE POLICY "Admins update saint icon overrides" ON public.saint_icon_overrides
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins delete saint icon overrides" ON public.saint_icon_overrides;
CREATE POLICY "Admins delete saint icon overrides" ON public.saint_icon_overrides
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_saint_icon_overrides_updated_at ON public.saint_icon_overrides;
CREATE TRIGGER update_saint_icon_overrides_updated_at BEFORE UPDATE ON public.saint_icon_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins upload saint icons" ON storage.objects;
CREATE POLICY "Admins upload saint icons" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'saint-icons' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update saint icons" ON storage.objects;
CREATE POLICY "Admins update saint icons" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'saint-icons' AND public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- drizzle/migrations/0001_saint_icons_read.sql
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read saint icons" ON storage.objects;
CREATE POLICY "Admins read saint icons" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'saint-icons' AND public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- drizzle/migrations/0002_donor_tiers.sql
-- NOTE: existing rows get status='confirmed', refunded_amount=0,
-- donation_type='one-time' via the defaults (same as on the old project).
-- -----------------------------------------------------------------------------
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS refunded_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS donation_type text NOT NULL DEFAULT 'one-time',
  ADD COLUMN IF NOT EXISTS stripe_charge_id text,
  ADD COLUMN IF NOT EXISTS checkout_session_id text,
  ADD COLUMN IF NOT EXISTS thank_you_sent_at timestamptz;

-- Unique partial index. Guarded: if the NEW db already holds duplicate
-- stripe_payment_intent_id values the CREATE would abort the whole script,
-- so we skip it with a WARNING instead (dedupe manually, then re-run).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.donations
    WHERE stripe_payment_intent_id IS NOT NULL
    GROUP BY stripe_payment_intent_id HAVING count(*) > 1
  ) THEN
    RAISE WARNING 'donations has duplicate stripe_payment_intent_id values; donations_stripe_ref_unique NOT created';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS donations_stripe_ref_unique
      ON public.donations (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
  END IF;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS donor_anonymous boolean NOT NULL DEFAULT false;

-- -----------------------------------------------------------------------------
-- drizzle/migrations/0003_streak_nudges.sql
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.streak_nudges (
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
DROP POLICY IF EXISTS "Senders see their nudges" ON public.streak_nudges;
CREATE POLICY "Senders see their nudges" ON public.streak_nudges
  FOR SELECT TO authenticated USING (sender_id = auth.uid());
-- (Inserts happen only from edge function send-streak-nudge with service_role.)

-- -----------------------------------------------------------------------------
-- drizzle/migrations/0004_migration.sql  (groups.avatar_url + group-avatars policies)
-- Path convention: <group_id>/<timestamp>.<ext>  (GroupDetail.tsx:102)
-- -----------------------------------------------------------------------------
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS avatar_url text;

DROP POLICY IF EXISTS "Group avatars are publicly readable" ON storage.objects;
CREATE POLICY "Group avatars are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'group-avatars');
DROP POLICY IF EXISTS "Group admins upload avatars" ON storage.objects;
CREATE POLICY "Group admins upload avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'group-avatars' AND public.is_group_admin(((storage.foldername(name))[1])::uuid, auth.uid()));
DROP POLICY IF EXISTS "Group admins update avatars" ON storage.objects;
CREATE POLICY "Group admins update avatars" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'group-avatars' AND public.is_group_admin(((storage.foldername(name))[1])::uuid, auth.uid()));
DROP POLICY IF EXISTS "Group admins delete avatars" ON storage.objects;
CREATE POLICY "Group admins delete avatars" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'group-avatars' AND public.is_group_admin(((storage.foldername(name))[1])::uuid, auth.uid()));

-- -----------------------------------------------------------------------------
-- drizzle/migrations/0005_private_friend_donation_alerts.sql
-- + drizzle/migrations/0006_restrict_friend_donation_alert_writes.sql
-- -----------------------------------------------------------------------------
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS friend_notifications_processed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.friend_donation_notifications (
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
-- 0006:
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.friend_donation_notifications FROM anon, authenticated;
REVOKE SELECT, UPDATE ON public.friend_donation_notifications FROM anon;

ALTER TABLE public.friend_donation_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Recipients read public donations from current friends" ON public.friend_donation_notifications;
CREATE POLICY "Recipients read public donations from current friends"
ON public.friend_donation_notifications FOR SELECT TO authenticated USING (
  recipient_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = donor_id AND p.donor_anonymous = false)
  AND EXISTS (SELECT 1 FROM public.friends f WHERE (f.user_id = auth.uid() AND f.friend_id = donor_id) OR (f.friend_id = auth.uid() AND f.user_id = donor_id))
  AND NOT public.is_user_blocked(auth.uid(), donor_id)
);
DROP POLICY IF EXISTS "Recipients mark their own alerts read" ON public.friend_donation_notifications;
CREATE POLICY "Recipients mark their own alerts read"
ON public.friend_donation_notifications FOR UPDATE TO authenticated
USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

-- Realtime (useFriendDonationNotifications.ts:31 subscribes to INSERTs).
-- ALTER PUBLICATION ... ADD TABLE errors if already a member, so guard it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'friend_donation_notifications'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_donation_notifications;
  END IF;
END $$;

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

-- -----------------------------------------------------------------------------
-- drizzle/migrations/0007_add_missing_profile_notification_columns.sql
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fasting_reminder_days integer[] DEFAULT ARRAY[3];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wednesday_notifications_enabled boolean DEFAULT false;

-- -----------------------------------------------------------------------------
-- GAP (no drizzle file): profiles.referral_code
-- Only appears in Lovable's src/integrations/supabase/types.ts:1249/1271/1293
-- as `string | null`, optional on Insert. No code reads or writes it.
-- Inferred: nullable text, no default. (Uniqueness unknown; not added.)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;

-- -----------------------------------------------------------------------------
-- drizzle/migrations/0008_add_profile_identity_tags.sql
-- + drizzle/migrations/0009_add_profile_age_tag.sql (age column folded in)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_identity_tags (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  branch text,
  patron_saint_id text,
  country_code text,
  CONSTRAINT profile_identity_branch_length CHECK (branch IS NULL OR length(branch) BETWEEN 1 AND 64),
  CONSTRAINT profile_identity_patron_length CHECK (patron_saint_id IS NULL OR length(patron_saint_id) BETWEEN 1 AND 120),
  CONSTRAINT profile_identity_country_format CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$')
);
-- 0009:
ALTER TABLE public.profile_identity_tags
  ADD COLUMN IF NOT EXISTS age smallint CHECK (age IS NULL OR (age BETWEEN 13 AND 120));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_identity_tags TO authenticated;
GRANT ALL ON public.profile_identity_tags TO service_role;
ALTER TABLE public.profile_identity_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read their own identity tags" ON public.profile_identity_tags;
CREATE POLICY "Users read their own identity tags" ON public.profile_identity_tags
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert their own identity tags" ON public.profile_identity_tags;
CREATE POLICY "Users insert their own identity tags" ON public.profile_identity_tags
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update their own identity tags" ON public.profile_identity_tags;
CREATE POLICY "Users update their own identity tags" ON public.profile_identity_tags
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete their own identity tags" ON public.profile_identity_tags;
CREATE POLICY "Users delete their own identity tags" ON public.profile_identity_tags
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
COMMENT ON TABLE public.profile_identity_tags IS 'Optional self-description for the profile sticker; never used for authorization or app roles.';

-- -----------------------------------------------------------------------------
-- drizzle/migrations/0010_personal_calendar_reminders.sql
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 2000),
  event_date date NOT NULL,
  remind_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_reminders TO authenticated;
GRANT ALL ON public.calendar_reminders TO service_role;
ALTER TABLE public.calendar_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own calendar reminders" ON public.calendar_reminders;
CREATE POLICY "Users read own calendar reminders" ON public.calendar_reminders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users create own calendar reminders" ON public.calendar_reminders;
CREATE POLICY "Users create own calendar reminders" ON public.calendar_reminders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users edit own calendar reminders" ON public.calendar_reminders;
CREATE POLICY "Users edit own calendar reminders" ON public.calendar_reminders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own calendar reminders" ON public.calendar_reminders;
CREATE POLICY "Users delete own calendar reminders" ON public.calendar_reminders
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS calendar_reminders_user_date_idx ON public.calendar_reminders(user_id, event_date);

-- -----------------------------------------------------------------------------
-- Cron cleanup (not from drizzle): 20260528000000_add_notification_cron.sql
-- scheduled send-scheduled-reminders EVERY MINUTE against the OLD project with
-- the wrong auth header. Scheduling is owned by .github/workflows/send-notifications.yml,
-- so remove any pg_cron job that posts to the old ref. No-op if none exist.
-- -----------------------------------------------------------------------------
DO $$
DECLARE j record;
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    FOR j IN SELECT jobid, jobname FROM cron.job WHERE command LIKE '%atjpjmhumzfpotrkefaz%' LOOP
      PERFORM cron.unschedule(j.jobid);
      RAISE NOTICE 'unscheduled stale cron job % (%)', j.jobid, j.jobname;
    END LOOP;
  END IF;
END $$;

-- Ask PostgREST to reload its schema cache so the new tables/columns/RPC are visible.
NOTIFY pgrst, 'reload schema';

COMMIT;
