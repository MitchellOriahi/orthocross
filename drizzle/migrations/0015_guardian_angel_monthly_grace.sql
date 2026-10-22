ALTER TABLE public.user_streaks ADD COLUMN IF NOT EXISTS guardian_last_save_month text;

CREATE OR REPLACE FUNCTION public.process_streak_check()
 RETURNS TABLE(saved boolean, current_streak integer, guardian_angel_saves integer, guardian_angel_percentage integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_row public.user_streaks%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_month text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_saved boolean := false;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_row FROM public.user_streaks WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND OR v_row.last_activity_date IS NULL THEN RETURN; END IF;
  IF v_today - v_row.last_activity_date <= 1 THEN RETURN; END IF;
  IF COALESCE(v_row.current_streak, 0) = 0 THEN RETURN; END IF;

  -- One guaranteed save per calendar month for consistent readers (7+ day streak)
  IF v_row.current_streak >= 7 AND v_row.guardian_last_save_month IS DISTINCT FROM v_month THEN
    UPDATE public.user_streaks
       SET guardian_angel_saves = COALESCE(guardian_angel_saves,0) + 1,
           guardian_last_save_month = v_month,
           last_activity_date = v_today - 1,
           updated_at = now()
     WHERE user_id = v_user_id
     RETURNING * INTO v_row;
    v_saved := true;
  ELSE
    PERFORM public.apply_streak_loss_penalty();
    UPDATE public.user_streaks
       SET current_streak = 0, last_activity_date = NULL, updated_at = now()
     WHERE user_id = v_user_id
     RETURNING * INTO v_row;
  END IF;

  -- guardian_angel_percentage now reports whether this month's grace is still available (100) or used (0)
  RETURN QUERY SELECT v_saved, v_row.current_streak, v_row.guardian_angel_saves,
    CASE WHEN v_row.guardian_last_save_month IS DISTINCT FROM v_month THEN 100 ELSE 0 END;
END; $function$;