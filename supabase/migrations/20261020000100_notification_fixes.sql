-- Leaderboard pushes move server-side: send-scheduled-reminders sends a push
-- for every leaderboard_notifications row whose push_sent_at is null, then
-- stamps it.
ALTER TABLE public.leaderboard_notifications
  ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;

-- Don't push history: everything already in the table counts as sent.
UPDATE public.leaderboard_notifications
SET push_sent_at = now()
WHERE push_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leaderboard_notifications_push_pending
  ON public.leaderboard_notifications (created_at)
  WHERE push_sent_at IS NULL;

-- notify_friend_request() used to write friend requests into
-- leaderboard_notifications (month_date = 'friend_request'), which surfaced as
-- bogus leaderboard pushes. Friend-request badges and lists read
-- friend_request_notifications (written by create_friend_request_notification),
-- so this function becomes a no-op in case any trigger still points at it.
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
