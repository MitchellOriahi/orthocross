
-- 1. Restrict friend_activities INSERT — remove client policy, add validated RPC
DROP POLICY IF EXISTS "Users can create their own activities" ON public.friend_activities;

CREATE OR REPLACE FUNCTION public.log_friend_activity(
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_activity_type NOT IN (
    'chapter_completed','book_completed','bible_completed',
    'island_completed','saint_completed','campaign_completed'
  ) THEN
    RAISE EXCEPTION 'Invalid activity type: %', p_activity_type;
  END IF;

  INSERT INTO public.friend_activities (user_id, activity_type, activity_data)
  VALUES (v_user_id, p_activity_type, COALESCE(p_activity_data, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 2. Restrict monthly_leaderboard writes — remove client policies, add validated RPC
DROP POLICY IF EXISTS "Users can update their own leaderboard stats" ON public.monthly_leaderboard;
DROP POLICY IF EXISTS "Users can update their leaderboard stats" ON public.monthly_leaderboard;

CREATE OR REPLACE FUNCTION public.award_leaderboard_point(
  p_activity TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_month TEXT := to_char(now(), 'YYYY-MM');
  v_chapters_inc INT := 0;
  v_saints_inc INT := 0;
  v_history_inc INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  CASE p_activity
    WHEN 'chapter' THEN v_chapters_inc := 1;
    WHEN 'saint' THEN v_saints_inc := 1;
    WHEN 'history_island' THEN v_history_inc := 1;
    ELSE RAISE EXCEPTION 'Invalid activity: %', p_activity;
  END CASE;

  INSERT INTO public.monthly_leaderboard (
    user_id, month_date,
    chapters_completed, saints_read_count, history_islands_completed,
    total_points
  )
  VALUES (
    v_user_id, v_month,
    v_chapters_inc, v_saints_inc, v_history_inc,
    1
  )
  ON CONFLICT (user_id, month_date) DO UPDATE SET
    chapters_completed = monthly_leaderboard.chapters_completed + v_chapters_inc,
    saints_read_count = monthly_leaderboard.saints_read_count + v_saints_inc,
    history_islands_completed = monthly_leaderboard.history_islands_completed + v_history_inc,
    total_points = monthly_leaderboard.total_points + 1,
    updated_at = now();
END;
$$;

-- Ensure the unique constraint exists for the upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monthly_leaderboard_user_month_unique'
  ) THEN
    BEGIN
      ALTER TABLE public.monthly_leaderboard
        ADD CONSTRAINT monthly_leaderboard_user_month_unique UNIQUE (user_id, month_date);
    EXCEPTION WHEN duplicate_table OR unique_violation THEN
      NULL;
    END;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.apply_streak_loss_penalty()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_month TEXT := to_char(now(), 'YYYY-MM');
  v_row RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row FROM public.monthly_leaderboard
   WHERE user_id = v_user_id AND month_date = v_month;

  IF v_row IS NULL OR v_row.streak_penalty_applied THEN
    RETURN;
  END IF;

  UPDATE public.monthly_leaderboard
     SET total_points = total_points - floor(total_points / 2),
         streak_penalty_applied = true,
         updated_at = now()
   WHERE id = v_row.id;
END;
$$;

-- 3. Restrict user_avatars UPDATE to appearance-only columns
DROP POLICY IF EXISTS "Users can update their own avatar" ON public.user_avatars;

REVOKE UPDATE ON public.user_avatars FROM authenticated;
GRANT UPDATE (
  gender, skin_tone, hairstyle, eye_color, beard_option, outfit_palette, updated_at
) ON public.user_avatars TO authenticated;

CREATE POLICY "Users can update their own avatar appearance"
  ON public.user_avatars
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Limited public profile lookup for leaderboard
CREATE OR REPLACE FUNCTION public.get_public_profiles_for_leaderboard(p_user_ids UUID[])
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  profile_picture_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.display_name, p.profile_picture_url
    FROM public.profiles p
   WHERE p.id = ANY(p_user_ids);
$$;

-- 5. Lock function execution down to authenticated users only
REVOKE EXECUTE ON FUNCTION public.log_friend_activity(TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_friend_activity(TEXT, JSONB) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.award_leaderboard_point(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_leaderboard_point(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.apply_streak_loss_penalty() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_streak_loss_penalty() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles_for_leaderboard(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles_for_leaderboard(UUID[]) TO authenticated;

-- Revoke anon execute on existing user-facing security definer functions
DO $$
DECLARE
  fn_sig TEXT;
BEGIN
  FOR fn_sig IN
    SELECT n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prosecdef = true
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, PUBLIC', fn_sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn_sig);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- 6. Storage: stop allowing enumeration/listing of profile-pictures bucket.
-- Files remain publicly accessible by direct URL (bucket is public).
DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects;
