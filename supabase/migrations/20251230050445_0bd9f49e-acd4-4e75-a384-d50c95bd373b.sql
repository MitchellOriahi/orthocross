-- Add unique constraint for notification_log dedup
-- This prevents sending the same notification type to the same user on the same day
CREATE UNIQUE INDEX IF NOT EXISTS notification_log_dedup_idx 
  ON public.notification_log(user_id, type, local_date);

-- Add RLS policy for system inserts with service role (already exists but ensure it's there)
-- The edge function uses service role key so it bypasses RLS anyway