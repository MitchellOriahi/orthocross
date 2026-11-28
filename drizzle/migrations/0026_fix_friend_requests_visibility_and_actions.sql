-- Ensure table grants are present for authenticated users and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friend_requests TO authenticated;
GRANT ALL ON public.friend_requests TO service_role;
GRANT SELECT, UPDATE ON public.friend_request_notifications TO authenticated;
GRANT ALL ON public.friend_request_notifications TO service_role;
GRANT SELECT, DELETE ON public.friends TO authenticated;
GRANT ALL ON public.friends TO service_role;

-- Allow receivers to decline (delete) friend requests sent to them
DROP POLICY IF EXISTS "Users can delete received friend requests" ON public.friend_requests;
CREATE POLICY "Users can delete received friend requests"
ON public.friend_requests
FOR DELETE
TO authenticated
USING ((select auth.uid()) = receiver_id);

-- Make received request profile lookup resilient to missing usernames/profile rows
CREATE OR REPLACE FUNCTION public.get_received_request_profiles()
RETURNS TABLE (
  request_id uuid,
  sender_id uuid,
  username text,
  profile_picture_url text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fr.id AS request_id,
    fr.sender_id,
    COALESCE(NULLIF(trim(p.username), ''), NULLIF(trim(p.display_name), ''), 'User') AS username,
    p.profile_picture_url,
    fr.created_at
  FROM public.friend_requests fr
  LEFT JOIN public.profiles p ON p.id = fr.sender_id
  WHERE fr.receiver_id = auth.uid()
    AND fr.status = 'pending'
  ORDER BY fr.created_at DESC;
END;
$$;

-- Make sent request profile lookup resilient to missing usernames/profile rows
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
    fr.id AS request_id,
    fr.receiver_id,
    COALESCE(NULLIF(trim(p.username), ''), NULLIF(trim(p.display_name), ''), 'User') AS username,
    p.profile_picture_url
  FROM public.friend_requests fr
  LEFT JOIN public.profiles p ON p.id = fr.receiver_id
  WHERE fr.id = ANY(request_ids)
    AND fr.sender_id = auth.uid();
END;
$$;

-- Make accepting a friend request idempotent if the friendship already exists
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid;
  v_receiver_id uuid;
BEGIN
  SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
  FROM public.friend_requests
  WHERE id = request_id AND receiver_id = auth.uid();

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.friends f
    WHERE (f.user_id = v_sender_id AND f.friend_id = v_receiver_id)
       OR (f.user_id = v_receiver_id AND f.friend_id = v_sender_id)
  ) THEN
    INSERT INTO public.friends (user_id, friend_id)
    VALUES (v_sender_id, v_receiver_id)
    ON CONFLICT (user_id, friend_id) DO NOTHING;
  END IF;

  DELETE FROM public.friend_requests WHERE id = request_id;
END;
$$;

-- Explicit execute grants for authenticated users and service_role
REVOKE ALL ON FUNCTION public.get_received_request_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_received_request_profiles() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_friend_request_profiles(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_friend_request_profiles(uuid[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.accept_friend_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_friend_request(uuid) TO authenticated, service_role;

-- Ensure realtime emits friend_request_notifications changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'friend_request_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_request_notifications;
  END IF;
END $$;