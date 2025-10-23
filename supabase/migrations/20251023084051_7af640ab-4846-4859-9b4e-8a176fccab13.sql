-- Add voice recording preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS voice_recording_enabled BOOLEAN DEFAULT false;

-- Update existing users to have it disabled by default
UPDATE public.profiles 
SET voice_recording_enabled = false 
WHERE voice_recording_enabled IS NULL;