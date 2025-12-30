# OrthoCross Notifications Setup Guide

## ✅ What's Implemented

Your app now has a **professional notification system** with:

### 1. **Push Notifications via OneSignal**
- Timezone-aware scheduling
- Streak reminders at 6 PM local time
- Fasting/feast reminders at 8 PM local time (day before)
- External ID linking for targeting specific users

### 2. **Daily Streak Reminders** 
- Sent at 6 PM user's local time
- Only sent if user hasn't completed reading today
- Customizable via Settings → Notifications

### 3. **Fasting & Feast Notifications**
- Sent at 8 PM user's local time
- Triggered day before fast/feast starts
- Uses `fast_calendar` table for dates

---

## 🔧 Backend Setup

### Required Supabase Secrets

Ensure these secrets are configured in Supabase Edge Functions:

| Secret Name | Description |
|-------------|-------------|
| `ONESIGNAL_APP_ID` | Your OneSignal App ID |
| `ONESIGNAL_REST_API_KEY` | Your OneSignal REST API Key |
| `CRON_SECRET` | Secret to authenticate cron calls |
| `SUPABASE_URL` | Auto-provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided by Supabase |

### Database Tables Used

The notification system uses these existing tables:

#### `profiles` (notification preferences)
```sql
-- Columns used:
id                          -- User UUID
streak_notifications_enabled -- boolean, default true
fasting_notifications_enabled -- boolean, default false  
timezone                    -- text, default 'America/New_York'
```

#### `user_streaks` (streak tracking)
```sql
-- Columns used:
user_id        -- User UUID
current_streak -- int, current streak count
```

#### `fast_calendar` (fasting/feast dates)
```sql
-- Columns used:
date    -- date, the START day of fast/feast
is_fast -- boolean, true for fasts
label   -- text, name like "Great Lent begins"
```

#### `notification_log` (deduplication)
```sql
-- Columns used:
user_id    -- User UUID
type       -- 'streak_6pm' or 'fasting_8pm'
local_date -- date, user's local date when sent
-- Has unique index on (user_id, type, local_date)
```

---

## 📅 Scheduling the Edge Function

The `send-scheduled-reminders` function needs to run **every minute** to check if any user is at their notification time.

### Option 1: External Cron Service (Recommended)

Use a service like **cron-job.org**, **EasyCron**, or **GitHub Actions**:

#### GitHub Actions Example

Create `.github/workflows/send-notifications.yml`:

```yaml
name: Send Scheduled Notifications

on:
  schedule:
    # Runs every minute
    - cron: '* * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            "https://atjpjmhumzfpotrkefaz.supabase.co/functions/v1/send-scheduled-reminders" \
            -H "Content-Type: application/json" \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to your GitHub repository secrets (Settings → Secrets → Actions).

#### cron-job.org Example

1. Go to [cron-job.org](https://cron-job.org)
2. Create new cron job:
   - URL: `https://atjpjmhumzfpotrkefaz.supabase.co/functions/v1/send-scheduled-reminders`
   - Method: POST
   - Schedule: Every minute (`* * * * *`)
   - Headers: `x-cron-secret: YOUR_CRON_SECRET`

### Option 2: Supabase pg_cron (Advanced)

```sql
-- Enable extensions (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the function
SELECT cron.schedule(
  'send-scheduled-reminders',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://atjpjmhumzfpotrkefaz.supabase.co/functions/v1/send-scheduled-reminders',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

---

## 📊 Adding Fast/Feast Dates

Insert dates into `fast_calendar` to enable fasting notifications:

```sql
-- Example: 2026 Major Fasts and Feasts
INSERT INTO public.fast_calendar (date, is_fast, label) VALUES
  -- Great Lent 2026 (starts March 2)
  ('2026-03-02', true, 'Great Lent begins'),
  
  -- Pascha 2026
  ('2026-04-12', false, 'Pascha (Easter)'),
  
  -- Pentecost 2026
  ('2026-05-31', false, 'Pentecost'),
  
  -- Apostles Fast 2026
  ('2026-06-08', true, 'Apostles Fast begins'),
  ('2026-06-29', false, 'Feast of Ss. Peter and Paul'),
  
  -- Dormition Fast 2026
  ('2026-08-01', true, 'Dormition Fast begins'),
  ('2026-08-15', false, 'Dormition of the Theotokos'),
  
  -- Nativity Fast 2026
  ('2026-11-15', true, 'Nativity Fast begins'),
  ('2026-12-25', false, 'Nativity of Christ')
ON CONFLICT (date) DO UPDATE SET 
  label = EXCLUDED.label, 
  is_fast = EXCLUDED.is_fast;
```

---

## 🧪 Testing

### 1. Verify OneSignal External ID Linking

1. Sign in to your app on a mobile device
2. Go to OneSignal Dashboard → Audience → Subscriptions
3. Find your device and check that **External ID** matches your Supabase user UUID

### 2. Test the Edge Function

```bash
curl -X POST \
  "https://atjpjmhumzfpotrkefaz.supabase.co/functions/v1/send-scheduled-reminders" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "message": "Notifications processed",
  "duration_ms": 150,
  "users_processed": 10,
  "sentStreak": 0,
  "sentFasting": 0,
  "skippedWrongTime": 8,
  "skippedCompleted": 1,
  "skippedPrefsOff": 1,
  "skippedDup": 0,
  "oneSignalFailed": 0
}
```

### 3. Force-Time Test

To test without waiting for 6 PM/8 PM:

1. Temporarily set your timezone in Settings to a timezone where it's about to be 6 PM or 8 PM
2. Or modify the edge function temporarily to use current hour

---

## 📱 Mobile App Requirements

### OneSignal SDK Integration

The app uses the OneSignal Capacitor plugin. Key behaviors:

- **On Login/Session Restore**: Calls `OneSignal.login(user.id)`
- **On Logout**: Calls `OneSignal.logout()`
- **Retry Logic**: 0s, 2s, 5s delays if login fails
- **Permission Flow**: Requests permission before login

### Required Capacitor Plugins

```bash
npm install onesignal-cordova-plugin
npx cap sync
```

### iOS Setup

Add to `ios/App/App/AppDelegate.swift`:
```swift
import onesignal_cordova_plugin
```

### Android Setup

The OneSignal plugin auto-configures Android. Ensure your `google-services.json` is in `android/app/`.

---

## 🔍 Response Counters Explained

| Counter | Meaning |
|---------|---------|
| `sentStreak` | Streak reminders successfully sent |
| `sentFasting` | Fasting/feast reminders successfully sent |
| `skippedWrongTime` | User's local time isn't 6 PM or 8 PM |
| `skippedCompleted` | User already completed reading today |
| `skippedPrefsOff` | User has notifications disabled |
| `skippedDup` | Already sent this notification today |
| `oneSignalFailed` | OneSignal API returned error |

---

## 🔐 Security

- Edge function requires `x-cron-secret` header to match `CRON_SECRET`
- Uses service role key internally (never exposed to client)
- Unique index prevents duplicate notifications per day
- RLS policies protect user data

---

## 🎉 Production Checklist

- [ ] OneSignal App ID configured
- [ ] OneSignal REST API Key configured  
- [ ] CRON_SECRET set in both Supabase and cron service
- [ ] Cron job running every minute
- [ ] Fast/feast dates populated in `fast_calendar`
- [ ] Mobile app deployed with OneSignal SDK
- [ ] Users prompted for notification permissions
