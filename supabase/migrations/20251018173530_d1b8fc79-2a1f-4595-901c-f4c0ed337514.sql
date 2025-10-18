-- Add wednesday_notifications_enabled to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wednesday_notifications_enabled boolean DEFAULT false;

-- Update the handle_new_user function to set wednesday_notifications_enabled to false by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile with notification defaults
  INSERT INTO public.profiles (
    id, 
    fasting_notifications_enabled, 
    streak_notifications_enabled,
    fasting_reminder_days,
    wednesday_notifications_enabled
  )
  VALUES (
    new.id, 
    true, 
    true,
    ARRAY[3, 0],
    false
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
$function$;