-- Create a function to search for users by username, display name, or phone number
-- This bypasses RLS restrictions to allow friend searches
CREATE OR REPLACE FUNCTION public.search_user_for_friend_request(search_term text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_user_id uuid;
BEGIN
  -- Search by username (case-insensitive)
  SELECT id INTO found_user_id
  FROM public.profiles
  WHERE username ILIKE search_term
  LIMIT 1;
  
  -- If not found, search by display name (case-insensitive)
  IF found_user_id IS NULL THEN
    SELECT id INTO found_user_id
    FROM public.profiles
    WHERE display_name ILIKE search_term
    LIMIT 1;
  END IF;
  
  -- If still not found, search by phone number
  IF found_user_id IS NULL THEN
    SELECT user_id INTO found_user_id
    FROM public.user_phone_numbers
    WHERE phone_number = search_term
    LIMIT 1;
  END IF;
  
  RETURN found_user_id;
END;
$$;