
-- 1. group_activities: allowlist activity_type
ALTER TABLE public.group_activities
  DROP CONSTRAINT IF EXISTS group_activities_activity_type_check;
ALTER TABLE public.group_activities
  ADD CONSTRAINT group_activities_activity_type_check
  CHECK (activity_type IN (
    'chapter_completed','book_completed','bible_completed',
    'island_completed','saint_completed','campaign_completed',
    'member_joined','member_left','group_created','rank_achieved'
  ));

-- 2. user_avatars: revoke broad UPDATE, allow only appearance columns
REVOKE UPDATE ON public.user_avatars FROM authenticated, anon;
GRANT UPDATE (gender, skin_tone, hairstyle, eye_color, beard_option, outfit_palette, updated_at)
  ON public.user_avatars TO authenticated;

CREATE OR REPLACE FUNCTION public.award_avatar_xp(p_xp integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_xp IS NULL OR p_xp <= 0 OR p_xp > 1000 THEN
    RAISE EXCEPTION 'Invalid xp amount: %', p_xp;
  END IF;
  UPDATE public.user_avatars
     SET total_xp = COALESCE(total_xp, 0) + p_xp,
         updated_at = now()
   WHERE user_id = v_user_id;
END; $$;
REVOKE ALL ON FUNCTION public.award_avatar_xp(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_avatar_xp(integer) TO authenticated;

-- 3. user_streaks: revoke client UPDATE, expose server-side RPCs
REVOKE UPDATE, INSERT, DELETE ON public.user_streaks FROM authenticated, anon;
GRANT SELECT ON public.user_streaks TO authenticated;

CREATE OR REPLACE FUNCTION public.record_daily_activity()
RETURNS TABLE(current_streak integer, longest_streak integer, was_incremented boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_row public.user_streaks%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_diff integer;
  v_new_streak integer := 1;
  v_new_longest integer := 1;
  v_incremented boolean := true;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_row FROM public.user_streaks WHERE user_id = v_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_user_id, 1, 1, v_today);
    RETURN QUERY SELECT 1, 1, true;
    RETURN;
  END IF;

  IF v_row.last_activity_date IS NULL THEN
    v_new_streak := 1;
  ELSE
    v_diff := v_today - v_row.last_activity_date;
    IF v_diff = 0 THEN
      v_new_streak := v_row.current_streak;
      v_incremented := false;
    ELSIF v_diff = 1 THEN
      v_new_streak := v_row.current_streak + 1;
    ELSE
      v_new_streak := 1;
    END IF;
  END IF;
  v_new_longest := GREATEST(v_new_streak, COALESCE(v_row.longest_streak, 0));

  UPDATE public.user_streaks
     SET current_streak = v_new_streak,
         longest_streak = v_new_longest,
         last_activity_date = v_today,
         updated_at = now()
   WHERE user_id = v_user_id;

  RETURN QUERY SELECT v_new_streak, v_new_longest, v_incremented;
END; $$;
REVOKE ALL ON FUNCTION public.record_daily_activity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_daily_activity() TO authenticated;

CREATE OR REPLACE FUNCTION public.process_streak_check()
RETURNS TABLE(saved boolean, current_streak integer, guardian_angel_saves integer, guardian_angel_percentage integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_row public.user_streaks%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_diff integer;
  v_roll numeric;
  v_saved boolean := false;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_row FROM public.user_streaks WHERE user_id = v_user_id;
  IF NOT FOUND OR v_row.last_activity_date IS NULL THEN
    RETURN QUERY SELECT false, COALESCE(v_row.current_streak,0), COALESCE(v_row.guardian_angel_saves,0), COALESCE(v_row.guardian_angel_percentage,0);
    RETURN;
  END IF;

  v_diff := v_today - v_row.last_activity_date;
  IF v_diff <= 1 THEN
    RETURN QUERY SELECT false, v_row.current_streak, v_row.guardian_angel_saves, v_row.guardian_angel_percentage;
    RETURN;
  END IF;

  v_roll := random() * 100;
  IF v_roll < COALESCE(v_row.guardian_angel_percentage, 0) THEN
    UPDATE public.user_streaks
       SET guardian_angel_saves = COALESCE(guardian_angel_saves,0) + 1,
           guardian_angel_percentage = GREATEST(0, COALESCE(guardian_angel_percentage,0) - 5),
           last_activity_date = v_today,
           updated_at = now()
     WHERE user_id = v_user_id
     RETURNING * INTO v_row;
    v_saved := true;
  ELSE
    PERFORM public.apply_streak_loss_penalty();
    UPDATE public.user_streaks
       SET current_streak = 0,
           last_activity_date = NULL,
           updated_at = now()
     WHERE user_id = v_user_id
     RETURNING * INTO v_row;
  END IF;

  RETURN QUERY SELECT v_saved, v_row.current_streak, v_row.guardian_angel_saves, v_row.guardian_angel_percentage;
END; $$;
REVOKE ALL ON FUNCTION public.process_streak_check() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_streak_check() TO authenticated;

-- 4. profile-pictures bucket: restrict listing to owner folder
DROP POLICY IF EXISTS "Users can list own profile pictures folder" ON storage.objects;
CREATE POLICY "Users can list own profile pictures folder"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
