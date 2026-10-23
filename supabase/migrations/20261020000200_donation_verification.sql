-- In-app purchase donations are verified with RevenueCat by the record-donation
-- edge function. Only status = 'confirmed' rows count toward tiers/leaderboards;
-- record-donation may also write 'pending_verification' or 'sandbox'.
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS store_transaction_id text;

CREATE UNIQUE INDEX IF NOT EXISTS donations_store_transaction_unique
  ON public.donations (store_transaction_id) WHERE store_transaction_id IS NOT NULL;

-- Donations are written only by edge functions (service role). The original
-- policy let any signed-in user insert their own (default 'confirmed') rows.
DROP POLICY IF EXISTS "Users can insert their own donations" ON public.donations;
REVOKE INSERT, UPDATE, DELETE ON public.donations FROM anon, authenticated;

-- Legacy leaderboard RPC: count only confirmed donations, net of refunds.
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
    CAST(SUM(GREATEST(0, d.amount - COALESCE(d.refunded_amount, 0))) AS integer) AS total_donated,
    p.username,
    p.profile_picture_url
  FROM donations d
  JOIN profiles p ON p.id = d.user_id
  WHERE d.status = 'confirmed'
  GROUP BY d.user_id, p.username, p.profile_picture_url
  HAVING SUM(GREATEST(0, d.amount - COALESCE(d.refunded_amount, 0))) > 0
  ORDER BY total_donated DESC
  LIMIT limit_count;
END;
$$;
