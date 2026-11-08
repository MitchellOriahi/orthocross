# iOS home screen widgets — handoff

The web app and backend are ready. WidgetKit itself (the widget extension, App Group,
SwiftUI views and a small Capacitor plugin) is built natively in Xcode.

## Widgets

| Widget | Family | Payload fields |
|---|---|---|
| Streak | `systemSmall` | `streak` |
| Verse | `systemMedium` | `verse` |
| Verse + streak | `systemMedium` | `verse`, `streak` |
| Today | `systemLarge` | `streak`, `verse`, `observance.primary` |

The verse is always the full text, so let it wrap. Use `.minimumScaleFactor`, never truncate.

## Sign-in model (read-only widget key)

1. When a user signs in on iOS, the app calls `widget-token` `{ "action": "issue" }` with their sign-in token.
   The response is `{ token: "ocw_…", endpoint }`. The app hands both to the native plugin
   (`setCredentials`), which stores them in the **App Group keychain**.
2. The widget's `TimelineProvider` calls `GET <endpoint>` with `Authorization: Bearer ocw_…`.
   Optionally add `?timezone=<TimeZone.current.identifier>`. Without it, the account's Settings time zone is used.
3. The key is read-only (widget data only). It never expires, and only its SHA-256 hash is stored.
   Signing out calls `widget-token` `{ "action": "revoke", "token" }` and the plugin's `clear()`.
   Deleting the account deletes every key. After a revoke the endpoint returns 401, so the widget should show a "Sign in to OrthoCross" state.
4. The app also writes each fresh snapshot to the App Group (`saveSnapshot`). Widgets can then render
   instantly from disk and only call the endpoint when the snapshot is older than `refreshAfter`.

## Native plugin contract — `OrthoCrossWidget` (see `src/lib/widgetBridge.ts`)

| Method | Behaviour |
|---|---|
| `setCredentials({ token, endpoint })` | Save to App Group keychain |
| `getCredentials() → { token, endpoint }` | `null`s when absent |
| `saveSnapshot({ json })` | Write JSON to App Group container |
| `reloadTimelines()` | `WidgetCenter.shared.reloadAllTimelines()` |
| `clear()` | Remove key + snapshot |

Until this plugin is in the build, the app skips all widget work silently, and nothing changes on the web.
The app syncs on sign-in, on return to the foreground, after a streak update, and after a calendar choice change.

## Payload (version 1)

```jsonc
{
  "version": 1,
  "generatedAt": "2026-11-08T22:40:00.000Z",
  "refreshAfter": "2026-11-09T00:00:00.000Z",   // schedule the next timeline entry here
  "timezone": "America/New_York",
  "localDate": "2026-11-08",
  "streak": { "current": 12, "longest": 30, "completedToday": false, "atRisk": true,
              "guardianSavePending": false, "lastActivityDate": "2026-11-07",
              "dayEndsAt": "2026-11-09T00:00:00.000Z" },   // streak days are counted in UTC, as in the app
  "verse": { "reference": "Jeremiah 29:11", "text": "…full verse…", "date": "2026-11-08" },
  "observance": {
    "date": "2026-11-08", "tradition": "Eastern Orthodox" | "Oriental Orthodox",
    "calendarSystem": "Gregorian" | "Julian",
    "primary": { "name": "Nativity Fast", "category": "feast" | "holiday" | "fast",
                 "kind": "event" | "weekly", "isMajor": true,
                 "startDate": "2026-11-15", "endDate": "2026-12-24",
                 "dayOfPeriod": 6, "totalDays": 40 } | null,
    "events": [ /* every observance today, same shape, priority order */ ],
    "weeklyFast": false
  },
  "appearance": {
    "light": { "background", "card", "text", "secondaryText", "border", "streak", "streakInactive",
               "feast", "holiday", "fast", "weeklyFast", "feastText", "holidayText", "fastText",
               "weeklyFastText", "traditionAccent" },   // all "#RRGGBB"
    "dark":  { /* same keys */ }
  }
}
```

Priority for `primary` is Feast > Holiday > Fast > Wednesday/Friday fast, the same as the calendar grid.
Pick `appearance.light` or `.dark` from `@Environment(\.colorScheme)`.

## Production (uceqydqvjapkobqwrbxw) — before shipping

- Port `drizzle/migrations/0018_widget_data.sql` (it is idempotent) and apply it.
- Deploy `widget-data` and `widget-token`. Both are `verify_jwt = false` in `supabase/config.toml`, because widget keys are not sign-in tokens and each function checks auth itself.
