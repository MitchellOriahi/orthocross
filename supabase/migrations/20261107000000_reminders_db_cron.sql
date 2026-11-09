-- GitHub Actions' 30-minute schedule is throttled to every 4-8 hours, so the
-- 8 AM / 6 PM / 8 PM local-hour windows were mostly missed. Drive the reminders
-- from pg_cron instead; the secret is read from scheduler_secrets at run time.
-- Overlapping runs (this job + the GitHub workflow) are deduplicated by
-- notification_log and leaderboard push_sent_at claims.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE j bigint;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname = 'send-scheduled-reminders' LOOP
    PERFORM cron.unschedule(j);
  END LOOP;
END $$;

SELECT cron.schedule(
  'send-scheduled-reminders',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://uceqydqvjapkobqwrbxw.supabase.co/functions/v1/send-scheduled-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT secret FROM public.scheduler_secrets WHERE name = 'reminders')
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 60000
    )
  $$
);
