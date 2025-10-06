-- Add last_activity_date column to track daily activity for streak calculation
ALTER TABLE public.user_streaks 
ADD COLUMN IF NOT EXISTS last_activity_date date;