-- Create notification channels function to be called on app initialization
CREATE OR REPLACE FUNCTION public.create_notification_channels()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This is a placeholder function
  -- Actual notification channel creation happens in the mobile app
  -- through Capacitor's LocalNotifications plugin
  -- This function can be used to log channel creation or perform other setup
  RAISE NOTICE 'Notification channels should be created in mobile app';
END;
$$;

-- Update the handle_new_user function to trigger welcome email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Insert profile with notification defaults
  INSERT INTO public.profiles (
    id, 
    fasting_notifications_enabled, 
    streak_notifications_enabled,
    fasting_reminder_days,
    wednesday_notifications_enabled,
    friends_notifications_enabled
  )
  VALUES (
    new.id, 
    true, 
    true,
    ARRAY[3, 0],
    false,
    true
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

  -- Get user email from metadata
  v_user_email := new.email;

  -- Call edge function to send welcome email (fire and forget)
  PERFORM net.http_post(
    url := current_setting('app.settings.api_url') || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'email', v_user_email,
      'username', new.raw_user_meta_data->>'username'
    )
  );

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation if email fails
    RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
    RETURN new;
END;
$$;