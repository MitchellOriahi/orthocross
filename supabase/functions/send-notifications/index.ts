import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cronSecret = Deno.env.get("SCHEDULER_SECRET_TOKEN");

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

async function sendOneSignalNotification(
  externalUserId: string,
  title: string,
  body: string
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
      }),
    });
    const result = await response.json();
    if (!response.ok || result.errors?.length) {
      console.error(`[OneSignal] Error:`, result.errors || result);
      return false;
    }
    return (result.recipients || 0) > 0;
  } catch (error: any) {
    console.error(`[OneSignal] Fetch error:`, error.message);
    return false;
  }
}

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

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OneSignal not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();
    console.log(`[send-notifications] Starting at ${new Date().toISOString()}`);

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

        const sent = await sendOneSignalNotification(profile.id, "OrthoCross Reminder", message);
        if (sent) {
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

        const sent = await sendOneSignalNotification(profile.id, fastDay.is_fast ? "Upcoming Fast" : "Upcoming Feast", message);
        if (sent) {
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
