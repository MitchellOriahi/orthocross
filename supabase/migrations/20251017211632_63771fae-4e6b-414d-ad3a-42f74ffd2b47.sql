-- Update profiles table to enable notifications by default
ALTER TABLE public.profiles 
  ALTER COLUMN fasting_notifications_enabled SET DEFAULT true,
  ALTER COLUMN streak_notifications_enabled SET DEFAULT true;

-- Update existing users to have notifications enabled
UPDATE public.profiles 
SET 
  fasting_notifications_enabled = true,
  streak_notifications_enabled = true
WHERE fasting_notifications_enabled = false OR streak_notifications_enabled = false;