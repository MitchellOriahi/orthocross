import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cronSecret = Deno.env.get("CRON_SECRET") || Deno.env.get("SCHEDULER_SECRET_TOKEN");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// ─── OneSignal helper ───────────────────────────────────────────────

async function sendOneSignalNotification(
  externalUserId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<boolean> {
  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [externalUserId],
        headings: { en: title },
        contents: { en: body },
        data,
      }),
    });

    const result = await response.json();
    if (!response.ok || result.errors?.length) {
      console.error(`[OneSignal] Error for ${externalUserId.substring(0, 8)}:`, result.errors || result);
      return false;
    }
    return (result.recipients || 0) > 0;
  } catch (error: any) {
    console.error(`[OneSignal] Fetch error:`, error.message);
    return false;
  }
}

// ─── Time helpers ───────────────────────────────────────────────────

function getLocalTime(timezone: string): { hour: number; minute: number; dateStr: string } {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric", minute: "numeric", hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
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
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(tomorrow);
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

  // Verify authorization — require a configured cron secret (fail closed)
  const requestSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || requestSecret !== cronSecret) {
    console.log("[send-scheduled-reminders] Unauthorized");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error("[send-scheduled-reminders] OneSignal not configured");
    return new Response(
      JSON.stringify({ error: "OneSignal not configured. Set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY secrets." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();
    console.log(`[send-scheduled-reminders] Starting at ${new Date().toISOString()}`);

    const counters = {
      sentStreak: 0,
      sentFasting: 0,
      skippedWrongTime: 0,
      skippedCompleted: 0,
      skippedPrefsOff: 0,
      skippedDup: 0,
      oneSignalFailed: 0,
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
      // Deduplication via notification_log prevents double-sending within the same hour
      const isStreakTime = localTime.hour === 18;

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

            const sent = await sendOneSignalNotification(profile.id, "OrthoCross Reminder", message);

            if (sent) {
              await supabase.from("notification_log").insert({
                user_id: profile.id,
                type: "streak_6pm",
                local_date: localTime.dateStr,
              });
              counters.sentStreak++;
              console.log(`[streak] Sent to ${profile.id.substring(0, 8)}...`);
            } else {
              counters.oneSignalFailed++;
            }
          }
        }
      } else if (isStreakTime && !profile.streak_notifications_enabled) {
        counters.skippedPrefsOff++;
      }

      // ========== FASTING NOTIFICATIONS at 20:00 (8pm) local time ==========
      // Deduplication via notification_log prevents double-sending within the same hour
      const isFastingTime = localTime.hour === 20;

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

            const sent = await sendOneSignalNotification(
              profile.id,
              calendarEvent.is_fast ? "Upcoming Fast" : "Upcoming Feast",
              message
            );

            if (sent) {
              await supabase.from("notification_log").insert({
                user_id: profile.id,
                type: "fasting_8pm",
                local_date: localTime.dateStr,
              });
              counters.sentFasting++;
              console.log(`[fasting] Sent to ${profile.id.substring(0, 8)}... for ${calendarEvent.label}`);
            } else {
              counters.oneSignalFailed++;
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
