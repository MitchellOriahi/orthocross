-- Drop the trigger first, then recreate the function with proper search_path
DROP TRIGGER IF EXISTS on_leaderboard_update ON public.monthly_leaderboard;
DROP FUNCTION IF EXISTS public.check_leaderboard_position_change();

CREATE OR REPLACE FUNCTION public.check_leaderboard_position_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_rank INTEGER;
  v_new_rank INTEGER;
  v_passed_by_user_id UUID;
BEGIN
  -- Get the user's old rank (before this update)
  SELECT COUNT(*) + 1 INTO v_old_rank
  FROM public.monthly_leaderboard
  WHERE month_date = NEW.month_date
    AND total_points > OLD.total_points
    AND user_id != NEW.user_id;

  -- Get the user's new rank (after this update)
  SELECT COUNT(*) + 1 INTO v_new_rank
  FROM public.monthly_leaderboard
  WHERE month_date = NEW.month_date
    AND total_points > NEW.total_points
    AND user_id != NEW.user_id;

  -- If the user's rank improved, check if they passed anyone
  IF v_new_rank < v_old_rank THEN
    -- Find users who were ahead but are now behind
    FOR v_passed_by_user_id IN
      SELECT ml.user_id
      FROM public.monthly_leaderboard ml
      WHERE ml.month_date = NEW.month_date
        AND ml.user_id != NEW.user_id
        AND ml.total_points >= OLD.total_points
        AND ml.total_points < NEW.total_points
    LOOP
      -- Insert notification for each user that got passed
      INSERT INTO public.leaderboard_notifications (user_id, passed_by_user_id, month_date)
      VALUES (v_passed_by_user_id, NEW.user_id, NEW.month_date);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Recreate the trigger
CREATE TRIGGER on_leaderboard_update
  AFTER UPDATE OF total_points ON public.monthly_leaderboard
  FOR EACH ROW
  WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
  EXECUTE FUNCTION public.check_leaderboard_position_change();