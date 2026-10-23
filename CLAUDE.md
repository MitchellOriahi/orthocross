# OrthoCross — Claude Code guide

Orthodox Christian companion app (Bible reading, prayers, saints, fasting calendar,
gamified Church history, journal, friends/groups, donations). React + Vite +
Supabase + Capacitor (iOS/Android). The founder is non-technical and edits the app
in **Lovable**; Mitchel (the user here) is an intermediate developer who reviews,
fixes, and ships. Lovable's own architecture notes are in AGENTS.md:

@AGENTS.md

## The two-backend rule (read first)

- **Our production backend is Supabase project `uceqydqvjapkobqwrbxw`.** Every build
  that ships (website on DigitalOcean, iOS, Android) must use it.
- **Lovable is tied to the OLD project `atjpjmhumzfpotrkefaz`** and keeps rewriting
  `.env` and `src/integrations/supabase/types.ts` to point at it. Don't "fix" `.env` —
  `.env.production` (committed) overrides it for every `vite build`. `npm run dev`
  uses `.env` (old backend) unless you create an untracked `.env.local` with the
  new-backend values.
- Lovable writes its database SQL to `drizzle/migrations/`, not `supabase/migrations/`.
  Those changes exist only on the OLD database until we port them.

## After every pull of Lovable's changes

```bash
git pull
npm install
npm run check:parity
```

`check:parity` compares Lovable's expected schema with our live database, lists edge
functions not deployed, Lovable-only service calls (`ai.gateway.lovable.dev`,
`LOVABLE_API_KEY`, `lovable.app`), and images that only exist on Lovable's hosting.
Fix everything it reports before shipping:
- **Schema gaps** → port the new `drizzle/migrations/*.sql` into an idempotent file
  in `supabase/migrations/`, show the user, apply with
  `npx supabase db query --linked --project-ref uceqydqvjapkobqwrbxw -f <file>`.
- **Functions** → `npx supabase functions deploy <name> --project-ref uceqydqvjapkobqwrbxw`
  (redeploy any function or `_shared/` file Lovable changed).
- **Lovable-only AI calls** → use Gemini directly (`GEMINI_API_KEY`), as in
  `read-aloud` and `generate-verse-image`.
- **Images** (`src/**/*.asset.json` → `/__l5e/assets-v1/...`) → `npm run sync:lovable-assets`
  copies them into `public/` so web/iOS/Android serve them locally.

## Notifications — where to edit

Server pushes (change text/time → redeploy the function; no app update needed):
- Streak 6 PM, fast/feast eve 8 PM, verse 8 AM, Wed/Fri fast eve, leaderboard:
  `supabase/functions/send-scheduled-reminders/index.ts`
- Triggered pushes: `send-streak-nudge`, `send-friend-request-notification`,
  `send-group-invitation-notification`, `send-reaction-notification`,
  `_shared/friendDonationNotifications.ts`
- Emails: `_shared/donorStats.ts` (Stripe), `send-donation-thank-you`, `send-cancellation-email`
- Scheduler: `.github/workflows/send-notifications.yml` (every 30 min, `x-cron-secret`)
- Data: verse list = `daily_verses` table; fast/feast dates = `fast_calendar` table.
Client (needs a new app build): `src/hooks/usePushNotifications.ts` (OneSignal init,
tap → `data.path`), toggles in `src/pages/Settings.tsx`.

## iOS release

The `ios/` folder is generated on Ardo's Mac by `scripts-ios-build.sh` (bundle id must
stay `com.lZASURkwsofX.OrthoCross`). See IOS-HANDOFF.md and IOS-PUSH-IAP.md. Native
donations use RevenueCat IAP and are verified server-side in `record-donation`
(needs secret `REVENUECAT_SECRET_API_KEY`); Stripe/monthly donations are web-only and
must never be reachable on native (App Review).

## Rules

- Ask before: `git push`, deploying functions, any SQL against the live database,
  deleting files or data, adding dependencies, downloading files.
- Never alter theological content (prayers, scripture, saints' data, fasting rules,
  feast names). Fasting logic follows the existing data/typikon in the repo; if data
  is missing (e.g. `fast_calendar` past its last date), ask for an approved source.
- Keep the visual style reverent. Match surrounding code; minimal comments.
- Use npm (package-lock.json is the lockfile). Never print or commit secrets;
  credentials live outside the repo in the parent folder.
