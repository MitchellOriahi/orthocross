
-- 1. Restrict monthly_leaderboard SELECT to authenticated users
DROP POLICY IF EXISTS "Users can view global leaderboard" ON public.monthly_leaderboard;
CREATE POLICY "Authenticated users can view global leaderboard"
ON public.monthly_leaderboard
FOR SELECT
TO authenticated
USING (true);

-- 2. Remove overly permissive write policies. SECURITY DEFINER triggers and
-- the service role bypass RLS, so dropping these does not break inserts from
-- backend triggers/edge functions, but blocks direct client writes.
DROP POLICY IF EXISTS "System can insert notifications" ON public.leaderboard_notifications;
DROP POLICY IF EXISTS "System can insert friend request notifications" ON public.friend_request_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.group_invitation_notifications;
DROP POLICY IF EXISTS "System can insert notification logs" ON public.notification_log;
DROP POLICY IF EXISTS "System can insert rankings" ON public.group_monthly_rankings;
DROP POLICY IF EXISTS "System can update rankings" ON public.group_monthly_rankings;
