-- Create table to track saint readings
CREATE TABLE IF NOT EXISTS public.saints_read (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saint_id text NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on saints_read
ALTER TABLE public.saints_read ENABLE ROW LEVEL SECURITY;

-- RLS policies for saints_read
CREATE POLICY "Users can insert their own saint readings"
  ON public.saints_read
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own saint readings"
  ON public.saints_read
  FOR SELECT
  USING (auth.uid() = user_id);

-- Update monthly_leaderboard to track points instead of just books
ALTER TABLE public.monthly_leaderboard 
  RENAME COLUMN books_completed TO total_points;

-- Add columns to track different point sources
ALTER TABLE public.monthly_leaderboard
  ADD COLUMN IF NOT EXISTS history_islands_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chapters_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saints_read_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_penalty_applied boolean DEFAULT false;

COMMENT ON TABLE public.saints_read IS 'Tracks when users read about saints';
COMMENT ON COLUMN public.monthly_leaderboard.total_points IS 'Total points: islands + chapters + saints - streak penalties';
COMMENT ON COLUMN public.monthly_leaderboard.history_islands_completed IS 'Number of history islands completed this month';
COMMENT ON COLUMN public.monthly_leaderboard.chapters_completed IS 'Number of scripture chapters completed this month';
COMMENT ON COLUMN public.monthly_leaderboard.saints_read_count IS 'Number of unique saints read about this month';
COMMENT ON COLUMN public.monthly_leaderboard.streak_penalty_applied IS 'Whether the 50% penalty for losing streak has been applied this month';