-- Create a separate table for phone numbers with strict security
CREATE TABLE public.user_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_phone_numbers ENABLE ROW LEVEL SECURITY;

-- Users can ONLY insert/update their own phone number, but CANNOT select it
-- Only edge functions with service role can read phone numbers
CREATE POLICY "Users can insert their own phone number"
ON public.user_phone_numbers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phone number"
ON public.user_phone_numbers
FOR UPDATE
USING (auth.uid() = user_id);

-- No SELECT policy - phone numbers can ONLY be read by edge functions with service role
-- This prevents any client-side access to phone numbers, addressing the security warning

-- Migrate existing phone numbers from profiles table
INSERT INTO public.user_phone_numbers (user_id, phone_number)
SELECT id, phone_number
FROM public.profiles
WHERE phone_number IS NOT NULL;

-- Remove phone_number column from profiles table
ALTER TABLE public.profiles DROP COLUMN phone_number;

-- Add trigger for updated_at
CREATE TRIGGER update_user_phone_numbers_updated_at
BEFORE UPDATE ON public.user_phone_numbers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();