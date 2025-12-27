-- Update RLS policy on monthly_leaderboard to allow viewing all entries (global leaderboard)
DROP POLICY IF EXISTS "Users can view leaderboard" ON public.monthly_leaderboard;

CREATE POLICY "Users can view global leaderboard" 
ON public.monthly_leaderboard 
FOR SELECT 
USING (true);

-- Create a view or allow reading donations publicly for top donators leaderboard
-- We need to update donations RLS to allow anonymous aggregated viewing
-- But keep individual donation privacy - so we'll create a function instead

CREATE OR REPLACE FUNCTION public.get_top_donators(limit_count integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  total_donated integer,
  username text,
  profile_picture_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.user_id,
    CAST(SUM(d.amount) AS integer) as total_donated,
    p.username,
    p.profile_picture_url
  FROM donations d
  JOIN profiles p ON p.id = d.user_id
  GROUP BY d.user_id, p.username, p.profile_picture_url
  ORDER BY total_donated DESC
  LIMIT limit_count;
END;
$$;