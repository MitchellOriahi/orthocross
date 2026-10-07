# Donor tiers, confirmed donations, and the new Donators section

## Why your donation didn't show
Your $1 monthly donation went through on Stripe, but the app only records a donation when the browser comes back from checkout and reports it. That step never ran, so nothing was saved. The fix is to have Stripe tell the app directly (a "webhook"). Your existing $1 gift will be added by hand once this is in place.

## What you'll get
1. **Lifetime tiers**: Angel $1, Archangel $10, Principality $25, Power $50, Virtue $100, Dominion $250, Throne $500, Cherub $750, Seraph $1,000. They're worked out from each donor's lifetime total minus refunds, and all the thresholds and wording live in one editable settings file.
2. **Donating**: you must be signed in. The website gets presets of $1, $10, $25, $50 and $100, a custom amount, and a choice between one-time and monthly. Phone app-store donations keep their fixed amounts.
3. **Confirmed only**: a donation counts only after Stripe confirms it. Refunds lower the total, and possibly the tier.
4. **Celebration screen**: a full-screen thank-you with your name, your tier icon and "You are now a(n) [Tier]". It also says either "You've risen from X to Y!" or "$X more to reach [Next Tier]". It has gentle light rays, a close button, and calmer motion for people who've turned on reduced motion.
5. **Nine tier icons**: a matching gold-line set on a dark background, made once and reused everywhere.
6. **Thank-you email**: sent once per donation. It includes your name, the amount, your tier and its icon, and a link back to the app. It makes no tax-deductible claim.
7. **Donators section**:
   - **Top 3**: gold, silver and bronze rank badges, each with an avatar, username, and tier icon and name. It follows your second screenshot, but no amounts are shown.
   - **"Show all donors" dropdown**: switches between "This month" and "All time", as a compact list in the style of your first screenshot. Each row shows rank, a small avatar, username and the tier name on the right.
   - **"Become a donator" button**: top right, with a faint glow if you haven't donated yet.
   - **Empty list**: shows "No donors yet. Be the first."
8. **Privacy**: a "Show my name / Donate anonymously" choice in Settings and in the donation window. Anonymous donors show as "Anonymous Donor" but still get a rank.

## One thing I'll need from you
After the webhook is built, I'll give you its web address. You'll add it in your Stripe account and paste Stripe's signing secret into a secure form. Until then, new donations can't be confirmed.

## Technical details
- Migration: new columns on `donations` (status, refunded_amount, donation_type, stripe_ref unique, thank_you_sent_at). Also `profiles.donor_anonymous`.
- New edge functions:
  - `stripe-webhook`: verifies the signature with STRIPE_WEBHOOK_SECRET. It handles `checkout.session.completed` (payment mode), `invoice.paid` (subscriptions) and `charge.refunded`. Inserts are idempotent and the email is claimed atomically.
  - `donor-status`: returns your own tier and progress, plus details of your latest donation for the celebration screen.
  - `donor-leaderboard`: totals and tiers are worked out on the server and no amounts are returned.
- The checkout functions require sign-in and attach `user_id` metadata to the session and the subscription. The `sessionId` path in `record-donation` is removed; only app-store purchases still use it.
- Tier config lives in `supabase/functions/_shared/donorTiers.ts` and is re-exported to the frontend. Unit tests cover the tier thresholds and the next-tier math.
