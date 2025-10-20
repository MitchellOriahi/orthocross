-- Fix search_path for friend request notification functions
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER AS $$
DECLARE
  sender_username text;
BEGIN
  -- Get the sender's username
  SELECT username INTO sender_username
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Insert notification for the receiver
  INSERT INTO public.leaderboard_notifications (
    user_id,
    passed_by_user_id,
    month_date,
    read
  ) VALUES (
    NEW.receiver_id,
    NEW.sender_id,
    'friend_request',
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix search_path for friend request notification function
CREATE OR REPLACE FUNCTION public.create_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.friend_request_notifications (
    receiver_id,
    sender_id,
    request_id
  ) VALUES (
    NEW.receiver_id,
    NEW.sender_id,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;