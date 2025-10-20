-- Add activity_visible column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN activity_visible boolean DEFAULT true;

-- Update RLS policy for friend_activities to respect activity_visible setting
DROP POLICY IF EXISTS "Users can view activities of their friends" ON public.friend_activities;

CREATE POLICY "Users can view activities of their friends"
ON public.friend_activities
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    EXISTS (
      SELECT 1 FROM friends
      WHERE (
        (friends.user_id = auth.uid() AND friends.friend_id = friend_activities.user_id)
        OR (friends.friend_id = auth.uid() AND friends.user_id = friend_activities.user_id)
      )
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = friend_activities.user_id 
      AND profiles.activity_visible = true
    )
  )
);