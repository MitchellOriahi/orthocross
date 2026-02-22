
-- Fix the handle_new_user() function to only reference existing columns
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
    friends_notifications_enabled,
    leaderboard_notifications_enabled,
    reaction_notifications_enabled,
    timezone
  )
  VALUES (
    new.id, 
    true, 
    true,
    true,
    true,
    true,
    'America/New_York'
  );

  RETURN new;
END;
$function$;
