-- Allow users to cancel their own friend requests
CREATE POLICY "Users can cancel their sent requests"
ON public.friend_requests
FOR DELETE
USING (auth.uid() = sender_id);