# OrthoCross — iOS (Capacitor) build hand-off for ARDO

Goal: build the OrthoCross iOS app from this repo (replacing the Natively wrapper)
and upload it to TestFlight so we can test on real iPhones. Everything scriptable
is already done; your part is one script + a few Xcode clicks.

Status (2026-08-22): the backend + web are fully migrated (backend: Supabase
project `uceqydqvjapkobqwrbxw`; web live at https://app.orthocrossapp.com).
The current iOS app is a Natively web wrapper pointed at that URL; this Capacitor
build replaces it. Once your build is live on the App Store, the Natively
subscription gets cancelled.

## Prerequisites (one-time)
- A Mac with **Xcode** installed (open it once, accept the license, install components).
- **CocoaPods**: `sudo gem install cocoapods` (or `brew install cocoapods`).
- **Node 18+**: `node -v` to check.
- Apple Developer Program membership on the account that owns the existing
  OrthoCross App Store listing (bundle id `com.lZASURkwsofX.OrthoCross`).

## Step 1 — run the prep script
```bash
git clone https://github.com/MitchellOriahi/orthocross.git
cd orthocross
bash scripts-ios-build.sh
```
This installs deps, builds the web app (already pointed at the new backend),
scaffolds `ios/`, syncs native plugins, and sets the correct bundle id.

## Step 2 — open Xcode
```bash
npx cap open ios
```

## Step 3 — signing (in Xcode)
1. Select the **App** target → **Signing & Capabilities** tab.
2. Check **Automatically manage signing**.
3. Set **Team** to the Apple Developer team that owns the OrthoCross listing.
4. Confirm **Bundle Identifier** shows `com.lZASURkwsofX.OrthoCross`.

## Step 4 — archive + upload to TestFlight
1. Top bar: set the run destination to **Any iOS Device (arm64)**.
2. Menu: **Product → Archive** (takes a few minutes).
3. In the Organizer window that opens: **Distribute App → App Store Connect →
   Upload** → keep defaults → **Upload**.
4. Wait for it to appear in App Store Connect → TestFlight (a few minutes to
   process). Add yourself + Mitch as **internal testers** — no review wait.

That's it — a working build on the new backend, installable via TestFlight.

Sanity checks in the TestFlight build: log in with a real account (data should be
there), record a voice note (mic permission should prompt), open Church Resources →
"Find churches near me" (should open Apple Maps).

---

## Notes / follow-ups (NOT needed for the first test build)
- **Backend**: the app is bundled with `.env` = the new Supabase project, so it
  loads the migrated data. No remote-URL config (unlike Natively).
- **Microphone / camera**: permission strings are already in `capacitor.config.ts`,
  so voice notes / camera work without extra setup (this is why Capacitor is better
  than Natively for us).
- **Push notifications (OneSignal)**: needs an APNs key in the OneSignal dashboard
  and the Push Notifications capability added in Xcode. Do this AFTER the first
  build works — ping Mitch/Claude to walk through it.
- **In-app purchases (RevenueCat)**: the plugin is bundled; StoreKit config +
  RevenueCat iOS API key wiring is a later step, same as push.
- **Bundle id is permanent**: it must stay `com.lZASURkwsofX.OrthoCross` to match
  the existing listing. The script sets this automatically.
