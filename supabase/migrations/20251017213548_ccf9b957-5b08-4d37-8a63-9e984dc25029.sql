-- Update default fasting reminder days to include same day (0) and 3 days before
ALTER TABLE profiles 
ALTER COLUMN fasting_reminder_days SET DEFAULT ARRAY[3, 0];

-- Update default notification settings for new users
ALTER TABLE profiles 
ALTER COLUMN fasting_notifications_enabled SET DEFAULT true;

ALTER TABLE profiles 
ALTER COLUMN streak_notifications_enabled SET DEFAULT true;

-- Update existing users who haven't customized their settings to include same day notifications
UPDATE profiles 
SET fasting_reminder_days = ARRAY[3, 0]
WHERE fasting_reminder_days = ARRAY[3];

-- Create or replace the handle_new_user function to set up default notifications
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile with notification defaults
  INSERT INTO public.profiles (
    id, 
    fasting_notifications_enabled, 
    streak_notifications_enabled,
    fasting_reminder_days
  )
  VALUES (
    new.id, 
    true, 
    true,
    ARRAY[3, 0]
  );

  -- Insert default 6 PM streak reminder
  INSERT INTO public.user_streak_reminders (
    user_id,
    hour,
    minute,
    enabled
  )
  VALUES (
    new.id,
    18,
    0,
    true
  );

  RETURN new;
END;
$$;