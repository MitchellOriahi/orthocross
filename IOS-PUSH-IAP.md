# OrthoCross — iOS Push (OneSignal) + In-App Purchases (RevenueCat)

Do this AFTER the first Capacitor iOS build is on TestFlight (see IOS-HANDOFF.md).
The app works without these; they just enable push notifications and donations on iOS.

The CODE is already done — nothing to change in the repo. What's left is account,
dashboard, and Xcode configuration. Bundle id everywhere is **com.lZASURkwsofX.OrthoCross**.
Legend: [Apple] Apple Developer / App Store Connect · [Dash] service dashboard · [Xcode] ARDO on the Mac.

Already set (no action): ONESIGNAL_APP_ID + ONESIGNAL_REST_API_KEY on the Supabase
project; VITE_ONESIGNAL_APP_ID and VITE_REVENUECAT_API_KEY_IOS in .env.

---

## A. Push notifications (OneSignal)

1. [Apple] Create an **APNs Auth Key**: developer.apple.com → Certificates, Identifiers
   & Profiles → **Keys** → + → check **Apple Push Notifications service (APNs)** →
   Continue → Register → **Download the .p8** (you can only download once). Note the
   **Key ID** and your **Team ID** (top-right of the portal).
2. [Dash] onesignal.com → the OrthoCross app → Settings → **Push & In-App** → **Apple iOS
   (APNs)** → Configure → choose **Token-based (.p8)** → upload the .p8, enter Key ID,
   Team ID, and bundle id `com.lZASURkwsofX.OrthoCross` → Save.
3. [Xcode] App target → **Signing & Capabilities** → **+ Capability**:
   - add **Push Notifications**
   - add **Background Modes**, then tick **Remote notifications**
4. [Xcode] Re-archive and upload to TestFlight (same as IOS-HANDOFF step 4).
5. Verify: install the TestFlight build, open the app, accept the notification prompt,
   then from OneSignal → Messages → New Push → send to "Subscribed Users". It should arrive.

Optional (richer notifications with images) — can be skipped for a first pass:
- [Xcode] File → New → Target → **Notification Service Extension**, name it
  `OneSignalNotificationServiceExtension`, bundle id
  `com.lZASURkwsofX.OrthoCross.OneSignalNotificationServiceExtension`. Follow OneSignal's
  Capacitor/iOS SDK guide for the extension code + pod. Ping Claude to wire this.

---

## B. In-App Purchases / donations (RevenueCat)

On iOS the Donate flow uses RevenueCat (web uses Stripe). The code reads
`getOfferings().current`, so an Offering MUST be configured or the donate sheet is empty.

1. [Apple] App Store Connect → Apps → OrthoCross → **In-App Purchases** → create **four
   Consumables** with these exact Product IDs (must match the code):
   - `donation_5`  ($4.99 tier) · `donation_10` · `donation_25` · `donation_50`
   Give each a display name + review screenshot; submit with the next build.
2. [Apple] App Store Connect → Users and Access → **Integrations → App Store Connect API**
   → generate an **In-App Purchase key** (.p8) → note Issuer ID + Key ID. (RevenueCat uses
   this to validate purchases.)
3. [Dash] app.revenuecat.com → Project → **Apps** → the iOS app (bundle id
   `com.lZASURkwsofX.OrthoCross`) → paste the App Store Connect API key from step 2.
4. [Dash] RevenueCat → **Products** → add `donation_5/10/25/50`. Then **Offerings** →
   the **current** offering → add a Package for each product. (No entitlement needed for
   consumable donations.)
5. [Xcode] App target → Signing & Capabilities → **+ Capability → In-App Purchase**.
6. Verify: App Store Connect → Users and Access → **Sandbox → Testers** → add a sandbox
   Apple ID. On the TestFlight build, sign into that sandbox account and run a donation —
   it should complete without charging a real card.

---

## Who does what (fastest split)
- **Founder** (owns the Apple account): APNs key (A1), IAP products (B1), ASC API key (B2),
  sandbox tester (B6). These need App Store Connect / Developer portal access.
- **ARDO** (Mac): all [Xcode] capability steps + re-archive/upload.
- **Mitch / Claude**: OneSignal + RevenueCat dashboard entry (A2, B3, B4) if you share access,
  or hand these to whoever holds those logins.
