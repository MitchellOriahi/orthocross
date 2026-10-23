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

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().split("T")[0];
}

function tzOffsetMs(instant: number, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

// UTC instant at which the given local calendar date begins in `timezone`.
function localMidnightUtc(dateStr: string, timezone: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  try {
    let instant = guess - tzOffsetMs(guess, timezone);
    instant = guess - tzOffsetMs(instant, timezone);
    return new Date(instant).toISOString();
  } catch {
    return new Date(guess).toISOString();
  }
}

// ─── Leaderboard ────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  timezone: string | null;
  leaderboard_notifications_enabled: boolean | null;
};

const LEADERBOARD_STALE_MS = 24 * 60 * 60 * 1000;

function chunk<T>(items: T[], size = 200): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Sends pushes for leaderboard_notifications rows written by the
// on_leaderboard_update trigger: user_id was passed by passed_by_user_id.
// Rows are claimed (push_sent_at set) before sending so overlapping runs
// never double-send. Recipients outside 8am–10pm local are retried next run.
async function processLeaderboardNotifications(
  supabase: any,
  profileById: Map<string, ProfileRow>,
  counters: Record<string, number>
) {
  const { data: rows, error } = await supabase
    .from("leaderboard_notifications")
    .select("id, user_id, passed_by_user_id, created_at")
    .is("push_sent_at", null)
    .neq("month_date", "friend_request")
    .order("created_at", { ascending: true })
    .limit(1000);

  if (error) {
    console.error("[leaderboard] fetch error:", error);
    return;
  }
  if (!rows?.length) return;

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const closeWithoutPush: string[] = [];
  const pending: typeof rows = [];

  for (const row of rows) {
    const profile = profileById.get(row.user_id);
    if (
      !profile ||
      profile.leaderboard_notifications_enabled === false ||
      row.user_id === row.passed_by_user_id ||
      now - new Date(row.created_at).getTime() > LEADERBOARD_STALE_MS
    ) {
      closeWithoutPush.push(row.id);
      continue;
    }
    const { hour } = getLocalTime(profile.timezone || "America/New_York");
    if (hour >= 8 && hour < 22) pending.push(row);
  }

  for (const ids of chunk(closeWithoutPush)) {
    await supabase.from("leaderboard_notifications").update({ push_sent_at: nowIso }).in("id", ids);
  }
  if (!pending.length) return;

  const claimed = new Set<string>();
  for (const ids of chunk(pending.map((r: { id: string }) => r.id))) {
    const { data } = await supabase
      .from("leaderboard_notifications")
      .update({ push_sent_at: nowIso })
      .in("id", ids)
      .is("push_sent_at", null)
      .select("id");
    (data ?? []).forEach((r: { id: string }) => claimed.add(r.id));
  }

  const byRecipient = new Map<string, string[]>();
  for (const row of pending) {
    if (!claimed.has(row.id)) continue;
    const passers = byRecipient.get(row.user_id) ?? [];
    passers.push(row.passed_by_user_id);
    byRecipient.set(row.user_id, passers);
  }
  if (!byRecipient.size) return;

  const passerIds = [...new Set([...byRecipient.values()].flat())];
  const nameById = new Map<string, string>();
  for (const ids of chunk(passerIds)) {
    const { data } = await supabase.from("profiles").select("id, username, display_name").in("id", ids);
    (data ?? []).forEach((p: any) => nameById.set(p.id, p.display_name || p.username || "Someone"));
  }

  for (const [recipientId, passers] of byRecipient) {
    const distinct = [...new Set(passers.reverse())];
    const name = nameById.get(distinct[0]) || "Someone";
    const others = distinct.length - 1;
    const message = others > 0
      ? `${name} and ${others} other${others === 1 ? "" : "s"} just surpassed you on the leaderboard! Keep going!`
      : `${name} just surpassed you on the leaderboard! Keep going!`;

    const sent = await sendOneSignalNotification(recipientId, "Leaderboard Update 📊", message, { path: "/friends" });
    if (sent) counters.sentLeaderboard++;
    else counters.oneSignalFailed++;
  }
}

// ─── Main handler ───────────────────────────────────────────────────

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authorization (fail closed): the database scheduler sends the
  // private secret stored in scheduler_secrets; an env secret or the
  // service-role bearer are also accepted for manual runs.
  const requestSecret = req.headers.get("x-cron-secret") ?? "";
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  let authorized = !!cronSecret && requestSecret === cronSecret;
  if (!authorized && bearer && bearer === supabaseServiceKey) authorized = true;
  if (!authorized && requestSecret) {
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { data } = await admin.from("scheduler_secrets").select("secret").eq("name", "reminders").maybeSingle();
    authorized = !!data?.secret && data.secret === requestSecret;
  }
  if (!authorized) {
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

    const counters: Record<string, number> = {
      sentStreak: 0,
      sentFasting: 0,
      sentVerse: 0,
      sentLeaderboard: 0,
      skippedWrongTime: 0,
      skippedCompleted: 0,
      skippedPrefsOff: 0,
      skippedDup: 0,
      oneSignalFailed: 0,
    };

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, streak_notifications_enabled, fasting_notifications_enabled, verse_notifications_enabled, leaderboard_notifications_enabled, timezone");

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

    try {
      await processLeaderboardNotifications(
        supabase, new Map(profiles.map((p: ProfileRow) => [p.id, p])), counters
      );
    } catch (error: any) {
      console.error("[leaderboard] Error:", error.message);
    }

    // Verse of the day is identical for everyone sharing a local date, so
    // resolve it once per distinct date (max ~2 across live timezones).
    const verseByDate = new Map<string, { reference: string; verse_text: string } | null>();
    const getVerseFor = async (dateStr: string) => {
      if (!verseByDate.has(dateStr)) {
        const { data, error } = await supabase.rpc("get_verse_of_the_day", { p_date: dateStr });
        if (error) console.error("[verse] rpc error:", error);
        verseByDate.set(dateStr, data && data.length > 0 ? data[0] : null);
      }
      return verseByDate.get(dateStr) ?? null;
    };

    for (const profile of profiles) {
      const timezone = profile.timezone || "America/New_York";
      const localTime = getLocalTime(timezone);
      const tomorrowDate = addDays(localTime.dateStr, 1);

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
          const todayStart = localMidnightUtc(localTime.dateStr, timezone);
          const todayEnd = localMidnightUtc(tomorrowDate, timezone);

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

            const sent = await sendOneSignalNotification(profile.id, "OrthoCross Reminder", message, { path: "/" });

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
              message,
              { path: "/dashboard" }
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

      // ========== VERSE OF THE DAY at 08:00 (8am) local time ==========
      const isVerseTime = localTime.hour === 8;

      if (isVerseTime && profile.verse_notifications_enabled !== false) {
        const { data: existingLog } = await supabase
          .from("notification_log")
          .select("id")
          .eq("user_id", profile.id)
          .eq("type", "verse_8am")
          .eq("local_date", localTime.dateStr)
          .maybeSingle();

        if (existingLog) {
          counters.skippedDup++;
        } else {
          const verse = await getVerseFor(localTime.dateStr);
          if (verse) {
            const sent = await sendOneSignalNotification(
              profile.id,
              "Verse of the Day",
              `"${verse.verse_text}" — ${verse.reference}`,
              { path: "/" }
            );
            if (sent) {
              await supabase.from("notification_log").insert({
                user_id: profile.id,
                type: "verse_8am",
                local_date: localTime.dateStr,
              });
              counters.sentVerse++;
            } else {
              counters.oneSignalFailed++;
            }
          }
        }
      } else if (isVerseTime && profile.verse_notifications_enabled === false) {
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
