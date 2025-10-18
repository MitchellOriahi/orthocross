-- Update profiles RLS policy to allow friends to view each other's profiles
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy that allows users to view their own profile AND their friends' profiles
CREATE POLICY "Users can view their own and friends' profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM public.friends
    WHERE (
      (friends.user_id = auth.uid() AND friends.friend_id = profiles.id)
      OR
      (friends.friend_id = auth.uid() AND friends.user_id = profiles.id)
    )
  )
);