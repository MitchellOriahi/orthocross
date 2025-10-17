-- Move extensions from public schema to cron schema for better security
CREATE SCHEMA IF NOT EXISTS cron;

-- Move pg_cron to cron schema
DROP EXTENSION IF EXISTS pg_cron CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;

-- Move pg_net to extensions schema  
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage on cron schema
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule fasting notifications to run daily at 9 AM
SELECT cron.schedule(
  'send-fasting-notifications',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://atjpjmhumzfpotrkefaz.supabase.co/functions/v1/schedule-fasting-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0anBqbWh1bXpmcG90cmtlZmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTM4OTUsImV4cCI6MjA3NTEyOTg5NX0.hzHWSQxOkfDKVRpS_FmRUFRkmFzPv1dQS6SsZLkjKp4"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule streak reminders to run daily at 6 PM
SELECT cron.schedule(
  'send-streak-reminders',
  '0 18 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://atjpjmhumzfpotrkefaz.supabase.co/functions/v1/send-streak-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0anBqbWh1bXpmcG90cmtlZmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTM4OTUsImV4cCI6MjA3NTEyOTg5NX0.hzHWSQxOkfDKVRpS_FmRUFRkmFzPv1dQS6SsZLkjKp4"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);