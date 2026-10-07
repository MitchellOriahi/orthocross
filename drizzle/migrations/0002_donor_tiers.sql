ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS refunded_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS donation_type text NOT NULL DEFAULT 'one-time',
  ADD COLUMN IF NOT EXISTS stripe_charge_id text,
  ADD COLUMN IF NOT EXISTS checkout_session_id text,
  ADD COLUMN IF NOT EXISTS thank_you_sent_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS donations_stripe_ref_unique ON public.donations (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS donor_anonymous boolean NOT NULL DEFAULT false;