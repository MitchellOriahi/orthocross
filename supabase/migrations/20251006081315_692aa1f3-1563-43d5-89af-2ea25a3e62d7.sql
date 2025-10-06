-- Add notification preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fasting_notifications_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS streak_notifications_enabled boolean DEFAULT false;