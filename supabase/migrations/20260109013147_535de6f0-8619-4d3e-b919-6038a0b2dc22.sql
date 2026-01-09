-- Add columns for leaderboard and reaction notifications (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'leaderboard_notifications_enabled') THEN
    ALTER TABLE public.profiles ADD COLUMN leaderboard_notifications_enabled boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'reaction_notifications_enabled') THEN
    ALTER TABLE public.profiles ADD COLUMN reaction_notifications_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Add unique constraint on notification_log for deduplication if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_log_unique_daily') THEN
    CREATE UNIQUE INDEX notification_log_unique_daily ON public.notification_log (user_id, type, local_date);
  END IF;
END $$;