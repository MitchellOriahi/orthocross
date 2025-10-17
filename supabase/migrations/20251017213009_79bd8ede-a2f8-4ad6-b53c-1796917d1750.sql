-- Add fasting reminder preferences column to profiles table
ALTER TABLE profiles 
ADD COLUMN fasting_reminder_days integer[] DEFAULT ARRAY[3];

COMMENT ON COLUMN profiles.fasting_reminder_days IS 'Array of days before event to send reminders (e.g., [3,2,1] for 3, 2, and 1 day before). Day-of notifications are always sent.';