-- Saint icon overrides: signed-in readers only
DROP POLICY IF EXISTS "Anyone can read saint icon overrides" ON public.saint_icon_overrides;
REVOKE SELECT ON public.saint_icon_overrides FROM anon;
CREATE POLICY "Signed-in users can read saint icon overrides"
  ON public.saint_icon_overrides FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Monthly leaderboard: direct reads limited to self, friends and group co-members
CREATE OR REPLACE FUNCTION public.can_view_leaderboard_entry(_viewer uuid, _owner uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _viewer IS NOT NULL AND (
    _viewer = _owner
    OR EXISTS (SELECT 1 FROM public.friends f
                WHERE (f.user_id = _viewer AND f.friend_id = _owner)
                   OR (f.friend_id = _viewer AND f.user_id = _owner))
    OR EXISTS (SELECT 1 FROM public.group_members me
                 JOIN public.group_members them ON them.group_id = me.group_id
                WHERE me.user_id = _viewer AND them.user_id = _owner)
  );
$$;

DROP POLICY IF EXISTS "Authenticated users can view global leaderboard" ON public.monthly_leaderboard;
CREATE POLICY "Users can view own, friends and group leaderboard rows"
  ON public.monthly_leaderboard FOR SELECT TO authenticated
  USING (public.can_view_leaderboard_entry(auth.uid(), user_id));

-- Global standings (points only, capped)
CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard(p_month text, p_limit integer DEFAULT 15)
RETURNS TABLE(user_id uuid, total_points integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  RETURN QUERY
    SELECT ml.user_id, ml.total_points
      FROM public.monthly_leaderboard ml
     WHERE ml.month_date = p_month
     ORDER BY ml.total_points DESC, ml.user_id ASC
     LIMIT LEAST(GREATEST(COALESCE(p_limit, 15), 1), 50);
END;
$$;

-- Caller's own rank (number of people ahead)
CREATE OR REPLACE FUNCTION public.get_my_leaderboard_rank(p_month text)
RETURNS TABLE(total_points integer, ahead integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_points integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT ml.total_points INTO v_points FROM public.monthly_leaderboard ml
   WHERE ml.month_date = p_month AND ml.user_id = auth.uid();
  IF v_points IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT v_points,
    (SELECT count(*)::int FROM public.monthly_leaderboard ml
      WHERE ml.month_date = p_month AND ml.total_points > v_points);
END;
$$;

-- Group standings for groups the caller may view
CREATE OR REPLACE FUNCTION public.get_group_member_points(p_group_id uuid, p_month text)
RETURNS TABLE(user_id uuid, total_points integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.groups g
                  WHERE g.id = p_group_id
                    AND (g.is_public OR public.is_group_member(g.id, auth.uid()) OR g.created_by = auth.uid())) THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT ml.user_id, ml.total_points
      FROM public.monthly_leaderboard ml
      JOIN public.group_members gm ON gm.user_id = ml.user_id AND gm.group_id = p_group_id
     WHERE ml.month_date = p_month;
END;
$$;

REVOKE ALL ON FUNCTION public.can_view_leaderboard_entry(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_monthly_leaderboard(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_leaderboard_rank(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_group_member_points(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_leaderboard_entry(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_monthly_leaderboard(text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_leaderboard_rank(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_group_member_points(uuid, text) TO authenticated, service_role;

-- Group avatars: only members of the group can read stored files
DROP POLICY IF EXISTS "Group avatars are publicly readable" ON storage.objects;
CREATE POLICY "Group members can read group avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'group-avatars'
         AND public.is_group_member(((storage.foldername(name))[1])::uuid, auth.uid()));

-- Bible audio: unused; no direct client reads
DROP POLICY IF EXISTS "Signed-in users can read bible audio" ON storage.objects;