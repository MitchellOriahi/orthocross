-- Drop the existing restrictive policy on user_streaks
DROP POLICY IF EXISTS "Users can view their own streak" ON public.user_streaks;

-- Create new policy that allows users to view their own streak AND friends' streaks when visible
CREATE POLICY "Users can view own and friends' visible streaks" 
ON public.user_streaks 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  (
    EXISTS (
      SELECT 1 FROM public.friends
      WHERE (
        (friends.user_id = auth.uid() AND friends.friend_id = user_streaks.user_id)
        OR 
        (friends.friend_id = auth.uid() AND friends.user_id = user_streaks.user_id)
      )
    )
    AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_streaks.user_id
      AND profiles.streak_visible = true
    )
  )
);