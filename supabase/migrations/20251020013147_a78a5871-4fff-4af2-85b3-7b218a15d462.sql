-- Ensure users can view friend requests sent to them (receiver can see)
DROP POLICY IF EXISTS "Users can view requests sent to them" ON public.friend_requests;
CREATE POLICY "Users can view requests sent to them"
ON public.friend_requests
FOR SELECT
USING (auth.uid() = receiver_id);

-- Create a trigger to send notifications when friend requests are created
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for friend requests
DROP TRIGGER IF EXISTS on_friend_request_created ON public.friend_requests;
CREATE TRIGGER on_friend_request_created
AFTER INSERT ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_friend_request();

-- Create a dedicated friend_request_notifications table for better tracking
CREATE TABLE IF NOT EXISTS public.friend_request_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  request_id uuid NOT NULL REFERENCES public.friend_requests(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.friend_request_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own friend request notifications"
ON public.friend_request_notifications
FOR SELECT
USING (auth.uid() = receiver_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own friend request notifications"
ON public.friend_request_notifications
FOR UPDATE
USING (auth.uid() = receiver_id);

-- System can insert notifications
CREATE POLICY "System can insert friend request notifications"
ON public.friend_request_notifications
FOR INSERT
WITH CHECK (true);

-- Create improved trigger function for friend request notifications
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS on_friend_request_created ON public.friend_requests;
CREATE TRIGGER on_friend_request_created
AFTER INSERT ON public.friend_requests
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.create_friend_request_notification();