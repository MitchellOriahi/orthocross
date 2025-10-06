-- Add DELETE policy for GDPR compliance and user privacy
CREATE POLICY "Users can delete their own phone number"
ON public.user_phone_numbers
FOR DELETE
USING (auth.uid() = user_id);

-- Verify all policies are properly restrictive by ensuring authentication
-- Drop and recreate SELECT policy with explicit authentication check
DROP POLICY IF EXISTS "Users can view their own phone number" ON public.user_phone_numbers;

CREATE POLICY "Users can view their own phone number"
ON public.user_phone_numbers
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Strengthen INSERT policy with explicit authentication check
DROP POLICY IF EXISTS "Users can insert their own phone number" ON public.user_phone_numbers;

CREATE POLICY "Users can insert their own phone number"
ON public.user_phone_numbers
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Strengthen UPDATE policy with explicit authentication check
DROP POLICY IF EXISTS "Users can update their own phone number" ON public.user_phone_numbers;

CREATE POLICY "Users can update their own phone number"
ON public.user_phone_numbers
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Add comment documenting the security model
COMMENT ON TABLE public.user_phone_numbers IS 'Stores user phone numbers with strict RLS policies. Users can only access their own phone number. Edge functions with service role can access all phone numbers for sending notifications.';

-- Verify RLS is enabled
ALTER TABLE public.user_phone_numbers ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner (extra security layer)
ALTER TABLE public.user_phone_numbers FORCE ROW LEVEL SECURITY;