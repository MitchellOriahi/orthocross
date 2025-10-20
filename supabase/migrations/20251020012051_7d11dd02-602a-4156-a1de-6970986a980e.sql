-- Create a function to get basic profile info for friend requests
-- This bypasses RLS to show username and profile picture for pending requests
CREATE OR REPLACE FUNCTION public.get_friend_request_profiles(request_ids uuid[])
RETURNS TABLE (
  request_id uuid,
  receiver_id uuid,
  username text,
  profile_picture_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id as request_id,
    fr.receiver_id,
    p.username,
    p.profile_picture_url
  FROM friend_requests fr
  JOIN profiles p ON p.id = fr.receiver_id
  WHERE fr.id = ANY(request_ids)
    AND fr.sender_id = auth.uid();
END;
$$;