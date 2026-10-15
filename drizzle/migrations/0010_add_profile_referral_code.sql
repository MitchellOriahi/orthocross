ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;
COMMENT ON COLUMN public.profiles.referral_code IS 'Referral code entered by the user in Refer a Friend; stored uppercase.';