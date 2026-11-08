CREATE OR REPLACE FUNCTION public.get_friend_profile_card(p_user_id uuid)
RETURNS TABLE(branch text, patron_saint_id text, country_code text, age smallint, donation_count integer, lifetime_cents integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH allowed AS (
    SELECT 1 AS ok WHERE auth.uid() IS NOT NULL AND (
      auth.uid() = p_user_id OR EXISTS (
        SELECT 1 FROM public.friends f
         WHERE (f.user_id = auth.uid() AND f.friend_id = p_user_id)
            OR (f.friend_id = auth.uid() AND f.user_id = p_user_id)))
  ), donor AS (
    SELECT CASE WHEN auth.uid() <> p_user_id AND COALESCE(p.donor_anonymous, false) THEN NULL ELSE count(d.id)::int END AS c,
           CASE WHEN auth.uid() <> p_user_id AND COALESCE(p.donor_anonymous, false) THEN NULL
                ELSE COALESCE(sum(GREATEST(0, d.amount - COALESCE(d.refunded_amount, 0))), 0)::int END AS cents
      FROM public.profiles p
      LEFT JOIN public.donations d ON d.user_id = p.id AND d.status = 'confirmed'
     WHERE p.id = p_user_id
     GROUP BY p.donor_anonymous
  )
  SELECT t.branch, t.patron_saint_id, t.country_code, t.age, donor.c, donor.cents
    FROM allowed
    CROSS JOIN donor
    LEFT JOIN public.profile_identity_tags t ON t.user_id = p_user_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_friend_profile_card(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_friend_profile_card(uuid) TO authenticated;