-- Add guardian angel columns to user_streaks table
ALTER TABLE public.user_streaks 
ADD COLUMN IF NOT EXISTS guardian_angel_saves integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS guardian_angel_percentage integer DEFAULT 40;