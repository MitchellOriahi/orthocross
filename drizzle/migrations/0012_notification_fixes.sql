GRANT SELECT ON public.daily_verses TO anon, authenticated;
GRANT ALL ON public.daily_verses TO service_role;
GRANT EXECUTE ON FUNCTION public.get_verse_of_the_day(date) TO anon, authenticated, service_role;

-- Leaderboard pushes are now sent server-side; track delivery per row.
ALTER TABLE public.leaderboard_notifications ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;
UPDATE public.leaderboard_notifications SET push_sent_at = now() WHERE push_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS leaderboard_notifications_unsent_idx
  ON public.leaderboard_notifications (created_at) WHERE push_sent_at IS NULL;

-- Private scheduler secret: no client grants, no policies; only the
-- database scheduler and the service role can read it.
CREATE TABLE IF NOT EXISTS public.scheduler_secrets (
  name text PRIMARY KEY,
  secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex')
);
REVOKE ALL ON public.scheduler_secrets FROM anon, authenticated;
GRANT ALL ON public.scheduler_secrets TO service_role;
ALTER TABLE public.scheduler_secrets ENABLE ROW LEVEL SECURITY;
INSERT INTO public.scheduler_secrets (name) VALUES ('reminders') ON CONFLICT DO NOTHING;