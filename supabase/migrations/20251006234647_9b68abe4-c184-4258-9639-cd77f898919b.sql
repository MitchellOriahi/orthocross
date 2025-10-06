-- Add SELECT policy for user_phone_numbers table
-- Users can only view their own phone number
CREATE POLICY "Users can view their own phone number"
ON public.user_phone_numbers
FOR SELECT
USING (auth.uid() = user_id);

-- This ensures users can see their own phone number (e.g., in settings to update it)
-- but cannot see other users' phone numbers, preventing data harvesting