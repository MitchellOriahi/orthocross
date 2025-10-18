-- Add friends_notifications_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS friends_notifications_enabled boolean DEFAULT true;

COMMENT ON COLUMN public.profiles.friends_notifications_enabled IS 'Enable notifications when friends complete books';