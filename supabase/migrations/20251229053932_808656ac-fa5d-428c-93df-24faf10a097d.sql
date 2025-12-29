-- Drop the user_streak_reminders table since we no longer need custom times
-- Streak reminders will be fixed at 6pm
DROP TABLE IF EXISTS public.user_streak_reminders;

-- Remove fasting_reminder_days and wednesday_notifications_enabled from profiles
-- since we're simplifying to just a single toggle with fixed 8pm-night-before timing
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS fasting_reminder_days,
DROP COLUMN IF EXISTS wednesday_notifications_enabled;