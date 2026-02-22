import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cronSecret = Deno.env.get("CRON_SECRET") || Deno.env.get("SCHEDULER_SECRET_TOKEN");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

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

  // Import RSA private key
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

  const signatureB64 = base64urlEncode(new Uint8Array(signature));
  return `${unsignedToken}.${signatureB64}`;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getFcmAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
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
  if (!response.ok) {
    throw new Error(`OAuth token error: ${JSON.stringify(data)}`);
  }

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
  body: string,
  data: Record<string, string> = {}
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
          message: {
            token: deviceToken,
            notification: { title, body },
            data,
          },
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      const errorCode = result?.error?.details?.[0]?.errorCode || result?.error?.code || "";
      const isInvalid =
        errorCode === "UNREGISTERED" ||
        errorCode === "INVALID_ARGUMENT" ||
        response.status === 404;
      return { success: false, error: JSON.stringify(result.error), invalidToken: isInvalid };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Send push to all tokens for a user ─────────────────────────────

async function sendPushToUser(
  supabase: any,
  accessToken: string,
  projectId: string,
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<{ sent: number; failed: number }> {
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("id, token")
    .eq("user_id", userId);

  if (!tokens || tokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const t of tokens) {
    const result = await sendFcmNotification(accessToken, projectId, t.token, title, body, data);
    if (result.success) {
      sent++;
    } else {
      failed++;
      // Remove invalid/unregistered tokens
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
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0");
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;

    return { hour, minute, dateStr: `${year}-${month}-${day}` };
  } catch {
    const now = new Date();
    return {
      hour: now.getUTCHours(),
      minute: now.getUTCMinutes(),
      dateStr: now.toISOString().split("T")[0],
    };
  }
}

function getTomorrowDate(timezone: string): string {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(tomorrow);
  } catch {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }
}

// ─── Main handler ───────────────────────────────────────────────────

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authorization
  const requestSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization");
  const hasCronSecret = cronSecret && requestSecret === cronSecret;
  const hasValidAuth = authHeader && supabaseAnonKey && authHeader === `Bearer ${supabaseAnonKey}`;

  if (!hasCronSecret && !hasValidAuth) {
    console.log("[send-scheduled-reminders] Unauthorized");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Check FCM config
  if (!FIREBASE_PROJECT_ID || !FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.error("[send-scheduled-reminders] Firebase not configured");
    return new Response(
      JSON.stringify({ error: "Firebase not configured. Set FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_JSON secrets." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();
    console.log(`[send-scheduled-reminders] Starting at ${new Date().toISOString()}`);

    // Get FCM access token (cached)
    const accessToken = await getFcmAccessToken(serviceAccount);

    const counters = {
      sentStreak: 0,
      sentFasting: 0,
      skippedWrongTime: 0,
      skippedCompleted: 0,
      skippedPrefsOff: 0,
      skippedDup: 0,
      fcmFailed: 0,
      invalidTokensRemoved: 0,
    };

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, streak_notifications_enabled, fasting_notifications_enabled, timezone");

    if (profilesError) {
      console.error("[send-scheduled-reminders] Error fetching profiles:", profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No profiles found", ...counters }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[send-scheduled-reminders] Processing ${profiles.length} users`);

    for (const profile of profiles) {
      const timezone = profile.timezone || "America/New_York";
      const localTime = getLocalTime(timezone);
      const tomorrowDate = getTomorrowDate(timezone);

      // ========== STREAK NOTIFICATIONS at 18:00 (6pm) local time ==========
      const isStreakTime = localTime.hour === 18 && localTime.minute < 5;

      if (isStreakTime && profile.streak_notifications_enabled) {
        const { data: existingLog } = await supabase
          .from("notification_log")
          .select("id")
          .eq("user_id", profile.id)
          .eq("type", "streak_6pm")
          .eq("local_date", localTime.dateStr)
          .maybeSingle();

        if (existingLog) {
          counters.skippedDup++;
        } else {
          const todayStart = `${localTime.dateStr}T00:00:00.000Z`;
          const todayEnd = `${localTime.dateStr}T23:59:59.999Z`;

          const [chaptersResult, saintsResult, historyResult] = await Promise.all([
            supabase.from("completed_chapters").select("id").eq("user_id", profile.id)
              .gte("completed_at", todayStart).lt("completed_at", todayEnd).limit(1),
            supabase.from("saints_read").select("id").eq("user_id", profile.id)
              .gte("read_at", todayStart).lt("read_at", todayEnd).limit(1),
            supabase.from("orthodox_history_progress").select("id").eq("user_id", profile.id)
              .eq("completed", true).gte("completed_at", todayStart).lt("completed_at", todayEnd).limit(1),
          ]);

          const hasCompletedToday =
            (chaptersResult.data?.length || 0) > 0 ||
            (saintsResult.data?.length || 0) > 0 ||
            (historyResult.data?.length || 0) > 0;

          if (hasCompletedToday) {
            counters.skippedCompleted++;
          } else {
            const { data: streakData } = await supabase
              .from("user_streaks").select("current_streak").eq("user_id", profile.id).maybeSingle();

            const currentStreak = streakData?.current_streak || 0;
            const message = currentStreak > 0
              ? `🔥 Keep Your ${currentStreak}-Day Streak! Complete your daily reading now.`
              : `📖 Start Your Reading Streak! Complete a reading today to begin.`;

            const result = await sendPushToUser(
              supabase, accessToken, FIREBASE_PROJECT_ID, profile.id,
              "OrthoCross Reminder", message
            );

            if (result.sent > 0) {
              await supabase.from("notification_log").insert({
                user_id: profile.id,
                type: "streak_6pm",
                local_date: localTime.dateStr,
              });
              counters.sentStreak++;
              console.log(`[streak] Sent to ${profile.id.substring(0, 8)}...`);
            } else {
              counters.fcmFailed++;
            }
          }
        }
      } else if (isStreakTime && !profile.streak_notifications_enabled) {
        counters.skippedPrefsOff++;
      }

      // ========== FASTING NOTIFICATIONS at 20:00 (8pm) local time ==========
      const isFastingTime = localTime.hour === 20 && localTime.minute < 5;

      if (isFastingTime && profile.fasting_notifications_enabled) {
        const { data: existingLog } = await supabase
          .from("notification_log")
          .select("id")
          .eq("user_id", profile.id)
          .eq("type", "fasting_8pm")
          .eq("local_date", localTime.dateStr)
          .maybeSingle();

        if (existingLog) {
          counters.skippedDup++;
        } else {
          const { data: calendarEvent } = await supabase
            .from("fast_calendar")
            .select("label, is_fast")
            .eq("date", tomorrowDate)
            .maybeSingle();

          if (!calendarEvent) {
            counters.skippedWrongTime++;
          } else {
            const message = calendarEvent.is_fast
              ? `🕊️ ${calendarEvent.label} begins tomorrow. Prepare to observe the fast.`
              : `✨ ${calendarEvent.label} is tomorrow. Prepare for the feast!`;

            const result = await sendPushToUser(
              supabase, accessToken, FIREBASE_PROJECT_ID, profile.id,
              calendarEvent.is_fast ? "Upcoming Fast" : "Upcoming Feast", message
            );

            if (result.sent > 0) {
              await supabase.from("notification_log").insert({
                user_id: profile.id,
                type: "fasting_8pm",
                local_date: localTime.dateStr,
              });
              counters.sentFasting++;
              console.log(`[fasting] Sent to ${profile.id.substring(0, 8)}... for ${calendarEvent.label}`);
            } else {
              counters.fcmFailed++;
            }
          }
        }
      } else if (isFastingTime && !profile.fasting_notifications_enabled) {
        counters.skippedPrefsOff++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[send-scheduled-reminders] Completed in ${duration}ms`, counters);

    return new Response(
      JSON.stringify({
        message: "Notifications processed",
        duration_ms: duration,
        users_processed: profiles.length,
        ...counters,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[send-scheduled-reminders] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
