-- Allow users to view requests they've received
CREATE POLICY "Users can view requests sent to them"
ON public.friend_requests
FOR SELECT
USING (auth.uid() = receiver_id);

-- Create a function to accept friend requests
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
  -- Get the sender and receiver IDs
  SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
  FROM friend_requests
  WHERE id = request_id AND receiver_id = auth.uid();
  
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or unauthorized';
  END IF;
  
  -- Create the friendship
  INSERT INTO friends (user_id, friend_id)
  VALUES (v_sender_id, v_receiver_id);
  
  -- Delete the friend request
  DELETE FROM friend_requests WHERE id = request_id;
END;
$$;

-- Create a function to get received request profiles
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
    fr.id as request_id,
    fr.sender_id,
    p.username,
    p.profile_picture_url,
    fr.created_at
  FROM friend_requests fr
  JOIN profiles p ON p.id = fr.sender_id
  WHERE fr.receiver_id = auth.uid()
    AND fr.status = 'pending'
  ORDER BY fr.created_at DESC;
END;
$$;