-- Enable required extensions (run once in Supabase dashboard if not already enabled:
--   Dashboard > Database > Extensions > enable pg_cron and pg_net)
-- This migration sets up the minute-by-minute cron that drives streak (6 PM) and
-- fasting (8 PM) push notifications for all users.

-- Schedule the send-scheduled-reminders edge function to run every minute.
-- IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY_HERE with the actual service role key
-- found in: Supabase Dashboard > Project Settings > API > service_role key
-- Do NOT commit the filled-in key to git. Run this SQL manually in the SQL editor.
select cron.schedule(
  'send-scheduled-reminders',
  '* * * * *',
  $$
    select net.http_post(
      url     := 'https://atjpjmhumzfpotrkefaz.supabase.co/functions/v1/send-scheduled-reminders',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE'
      ),
      body    := '{}'::jsonb
    )
  $$
);
