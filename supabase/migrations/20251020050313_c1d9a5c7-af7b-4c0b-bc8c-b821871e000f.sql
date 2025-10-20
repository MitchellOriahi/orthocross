-- Add policy to allow friends to view each other's completed chapters
CREATE POLICY "Friends can view each other's completed chapters"
ON public.completed_chapters
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friends
    WHERE (
      (friends.user_id = auth.uid() AND friends.friend_id = completed_chapters.user_id)
      OR
      (friends.friend_id = auth.uid() AND friends.user_id = completed_chapters.user_id)
    )
  )
);