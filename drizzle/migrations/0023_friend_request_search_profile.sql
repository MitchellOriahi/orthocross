CREATE OR REPLACE FUNCTION public.search_user_profile_for_friend_request(search_term text)
RETURNS TABLE(id uuid, username text, display_name text, profile_picture_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_user_id uuid;
BEGIN
  SELECT p.id INTO found_user_id
  FROM public.profiles p
  WHERE p.username ILIKE search_term
  LIMIT 1;

  IF found_user_id IS NULL THEN
    SELECT p.id INTO found_user_id
    FROM public.profiles p
    WHERE p.display_name ILIKE search_term
    LIMIT 1;
  END IF;

  IF found_user_id IS NULL THEN
    SELECT upn.user_id INTO found_user_id
    FROM public.user_phone_numbers upn
    WHERE upn.phone_number = search_term
    LIMIT 1;
  END IF;

  IF found_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.username, p.display_name, p.profile_picture_url
  FROM public.profiles p
  WHERE p.id = found_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_user_profile_for_friend_request(text) TO authenticated;