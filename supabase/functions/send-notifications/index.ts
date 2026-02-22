import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cronSecret = Deno.env.get("SCHEDULER_SECRET_TOKEN");

// Firebase credentials for FCM HTTP v1
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID");
const FIREBASE_SERVICE_ACCOUNT_JSON = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// ─── FCM HTTP v1 helpers ────────────────────────────────────────────

function base64urlEncode(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJwt(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = base64urlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(enc.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    enc.encode(unsignedToken)
  );

  return `${unsignedToken}.${base64urlEncode(new Uint8Array(signature))}`;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getFcmAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 300000) {
    return cachedAccessToken.token;
  }

  const jwt = await createJwt(serviceAccount);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`OAuth error: ${JSON.stringify(data)}`);

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function sendFcmNotification(
  accessToken: string,
  projectId: string,
  deviceToken: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string; invalidToken?: boolean }> {
  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: { token: deviceToken, notification: { title, body } },
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      const errorCode = result?.error?.details?.[0]?.errorCode || result?.error?.code || "";
      const isInvalid = errorCode === "UNREGISTERED" || errorCode === "INVALID_ARGUMENT" || response.status === 404;
      return { success: false, error: JSON.stringify(result.error), invalidToken: isInvalid };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendPushToUser(
  supabase: any,
  accessToken: string,
  projectId: string,
  userId: string,
  title: string,
  body: string
): Promise<{ sent: number; failed: number }> {
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("id, token")
    .eq("user_id", userId);

  if (!tokens || tokens.length === 0) return { sent: 0, failed: 0 };

  let sent = 0, failed = 0;
  for (const t of tokens) {
    const result = await sendFcmNotification(accessToken, projectId, t.token, title, body);
    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.invalidToken) {
        await supabase.from("push_tokens").delete().eq("id", t.id);
        console.log(`[FCM] Removed invalid token for ${userId.substring(0, 8)}...`);
      }
    }
  }
  return { sent, failed };
}

// ─── Time helpers ───────────────────────────────────────────────────

function getLocalTime(timezone: string): { hour: number; minute: number; dateStr: string } {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, hour: 'numeric', minute: 'numeric', hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    return {
      hour: parseInt(parts.find(p => p.type === 'hour')?.value || '0'),
      minute: parseInt(parts.find(p => p.type === 'minute')?.value || '0'),
      dateStr: `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`,
    };
  } catch {
    const now = new Date();
    return { hour: now.getUTCHours(), minute: now.getUTCMinutes(), dateStr: now.toISOString().split('T')[0] };
  }
}

function getTomorrowDate(timezone: string): string {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(tomorrow);
  } catch {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}

// ─── Main handler ───────────────────────────────────────────────────

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestSecret = req.headers.get("x-cron-secret");
  if (cronSecret && requestSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!FIREBASE_PROJECT_ID || !FIREBASE_SERVICE_ACCOUNT_JSON) {
    return new Response(
      JSON.stringify({ error: "Firebase not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();
    console.log(`[send-notifications] Starting at ${new Date().toISOString()}`);

    const accessToken = await getFcmAccessToken(serviceAccount);

    const results = {
      streak_notifications_sent: 0,
      fasting_notifications_sent: 0,
      streak_skipped_already_sent: 0,
      streak_skipped_completed_today: 0,
      fasting_skipped_already_sent: 0,
      fasting_skipped_no_fast: 0,
      errors: [] as string[],
    };

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, streak_notifications_enabled, fasting_notifications_enabled, timezone');

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No profiles found" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[send-notifications] Processing ${profiles.length} users`);

    for (const profile of profiles) {
      const timezone = profile.timezone || 'America/New_York';
      const localTime = getLocalTime(timezone);
      const tomorrowDate = getTomorrowDate(timezone);

      // STREAK at 18:00
      if (profile.streak_notifications_enabled && localTime.hour === 18 && localTime.minute < 5) {
        const { data: existingLog } = await supabase
          .from('notification_log').select('id')
          .eq('user_id', profile.id).eq('type', 'streak').eq('local_date', localTime.dateStr).single();

        if (existingLog) { results.streak_skipped_already_sent++; continue; }

        const todayStart = `${localTime.dateStr}T00:00:00.000Z`;
        const todayEnd = `${localTime.dateStr}T23:59:59.999Z`;

        const [ch, sa, hi] = await Promise.all([
          supabase.from('completed_chapters').select('id').eq('user_id', profile.id).gte('completed_at', todayStart).lt('completed_at', todayEnd).limit(1),
          supabase.from('saints_read').select('id').eq('user_id', profile.id).gte('read_at', todayStart).lt('read_at', todayEnd).limit(1),
          supabase.from('orthodox_history_progress').select('id').eq('user_id', profile.id).eq('completed', true).gte('completed_at', todayStart).lt('completed_at', todayEnd).limit(1),
        ]);

        if ((ch.data?.length || 0) > 0 || (sa.data?.length || 0) > 0 || (hi.data?.length || 0) > 0) {
          results.streak_skipped_completed_today++; continue;
        }

        const { data: streakData } = await supabase.from('user_streaks').select('current_streak').eq('user_id', profile.id).single();
        const currentStreak = streakData?.current_streak || 0;
        const message = currentStreak > 0
          ? `🔥 Keep Your ${currentStreak}-Day Streak! Don't forget your daily reading!`
          : `📖 Start Your Reading Streak! Complete a reading today.`;

        const sendResult = await sendPushToUser(supabase, accessToken, FIREBASE_PROJECT_ID, profile.id, "OrthoCross Reminder", message);

        if (sendResult.sent > 0) {
          await supabase.from('notification_log').insert({ user_id: profile.id, type: 'streak', local_date: localTime.dateStr });
          results.streak_notifications_sent++;
        } else {
          results.errors.push(`Streak failed for ${profile.id}`);
        }
      }

      // FASTING at 20:00
      if (profile.fasting_notifications_enabled && localTime.hour === 20 && localTime.minute < 5) {
        const { data: existingLog } = await supabase
          .from('notification_log').select('id')
          .eq('user_id', profile.id).eq('type', 'fasting').eq('local_date', localTime.dateStr).single();

        if (existingLog) { results.fasting_skipped_already_sent++; continue; }

        const { data: fastDay } = await supabase.from('fast_calendar').select('label, is_fast').eq('date', tomorrowDate).single();
        if (!fastDay) { results.fasting_skipped_no_fast++; continue; }

        const message = fastDay.is_fast
          ? `🕊️ ${fastDay.label} begins tomorrow. Prepare to observe the fast.`
          : `✨ ${fastDay.label} is tomorrow. Prepare for the feast!`;

        const sendResult = await sendPushToUser(supabase, accessToken, FIREBASE_PROJECT_ID, profile.id, fastDay.is_fast ? "Upcoming Fast" : "Upcoming Feast", message);

        if (sendResult.sent > 0) {
          await supabase.from('notification_log').insert({ user_id: profile.id, type: 'fasting', local_date: localTime.dateStr });
          results.fasting_notifications_sent++;
        } else {
          results.errors.push(`Fasting failed for ${profile.id}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[send-notifications] Completed in ${duration}ms`, results);

    return new Response(JSON.stringify({ message: "Notifications processed", duration_ms: duration, users_processed: profiles.length, ...results }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
