import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
const cronSecret = Deno.env.get("CRON_SECRET") || Deno.env.get("SCHEDULER_SECRET_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Helper to get local time components from a timezone
function getLocalTime(timezone: string): { hour: number; minute: number; dateStr: string } {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    
    return { hour, minute, dateStr: `${year}-${month}-${day}` };
  } catch {
    // Default to UTC if timezone is invalid
    const now = new Date();
    return {
      hour: now.getUTCHours(),
      minute: now.getUTCMinutes(),
      dateStr: now.toISOString().split('T')[0],
    };
  }
}

// Get tomorrow's date in a timezone
function getTomorrowDate(timezone: string): string {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(tomorrow);
  } catch {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}

// Send notification via OneSignal
async function sendOneSignalNotification(
  userId: string,
  heading: string,
  message: string
): Promise<{ success: boolean; result?: any; error?: string }> {
  if (!oneSignalAppId || !oneSignalApiKey) {
    console.log('[OneSignal] Not configured - missing app ID or API key');
    return { success: false, error: 'OneSignal not configured' };
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${oneSignalApiKey}`,
      },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        include_external_user_ids: [userId],
        contents: { en: message },
        headings: { en: heading },
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.log(`[OneSignal] API error for ${userId}:`, result);
    }
    return { success: response.ok && !result.errors, result };
  } catch (error: any) {
    console.error(`[OneSignal] Network error for ${userId}:`, error.message);
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify cron secret for security
  const requestSecret = req.headers.get("x-cron-secret");
  if (cronSecret && requestSecret !== cronSecret) {
    console.log("[send-scheduled-reminders] Unauthorized - invalid cron secret");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();
    console.log(`[send-scheduled-reminders] Starting at ${new Date().toISOString()}`);

    // Counters for response
    const counters = {
      sentStreak: 0,
      sentFasting: 0,
      skippedWrongTime: 0,
      skippedCompleted: 0,
      skippedPrefsOff: 0,
      skippedDup: 0,
      oneSignalFailed: 0,
    };

    // Get all users with their notification preferences and timezone
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, streak_notifications_enabled, fasting_notifications_enabled, timezone');

    if (profilesError) {
      console.error('[send-scheduled-reminders] Error fetching profiles:', profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('[send-scheduled-reminders] No profiles found');
      return new Response(
        JSON.stringify({ message: "No profiles found", ...counters }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-scheduled-reminders] Processing ${profiles.length} users`);

    for (const profile of profiles) {
      const timezone = profile.timezone || 'America/New_York';
      const localTime = getLocalTime(timezone);
      const tomorrowDate = getTomorrowDate(timezone);

      // ========== STREAK NOTIFICATIONS at 18:00 (6pm) local time ==========
      const isStreakTime = localTime.hour === 18 && localTime.minute < 5;
      
      if (!isStreakTime) {
        // Wrong time for this user's streak notification
      } else if (!profile.streak_notifications_enabled) {
        counters.skippedPrefsOff++;
      } else {
        // Check if notification already sent today (dedup)
        const { data: existingLog } = await supabase
          .from('notification_log')
          .select('id')
          .eq('user_id', profile.id)
          .eq('type', 'streak_6pm')
          .eq('local_date', localTime.dateStr)
          .maybeSingle();

        if (existingLog) {
          counters.skippedDup++;
        } else {
          // Check if user completed any reading today
          const todayStart = `${localTime.dateStr}T00:00:00.000Z`;
          const todayEnd = `${localTime.dateStr}T23:59:59.999Z`;

          const [chaptersResult, saintsResult, historyResult] = await Promise.all([
            supabase
              .from('completed_chapters')
              .select('id')
              .eq('user_id', profile.id)
              .gte('completed_at', todayStart)
              .lt('completed_at', todayEnd)
              .limit(1),
            supabase
              .from('saints_read')
              .select('id')
              .eq('user_id', profile.id)
              .gte('read_at', todayStart)
              .lt('read_at', todayEnd)
              .limit(1),
            supabase
              .from('orthodox_history_progress')
              .select('id')
              .eq('user_id', profile.id)
              .eq('completed', true)
              .gte('completed_at', todayStart)
              .lt('completed_at', todayEnd)
              .limit(1),
          ]);

          const hasCompletedToday = 
            (chaptersResult.data && chaptersResult.data.length > 0) ||
            (saintsResult.data && saintsResult.data.length > 0) ||
            (historyResult.data && historyResult.data.length > 0);

          if (hasCompletedToday) {
            counters.skippedCompleted++;
          } else {
            // Get user's current streak
            const { data: streakData } = await supabase
              .from('user_streaks')
              .select('current_streak')
              .eq('user_id', profile.id)
              .maybeSingle();

            const currentStreak = streakData?.current_streak || 0;
            const message = currentStreak > 0
              ? `🔥 Keep Your ${currentStreak}-Day Streak! Complete your daily reading now.`
              : `📖 Start Your Reading Streak! Complete a reading today to begin.`;

            // Send notification
            const sendResult = await sendOneSignalNotification(
              profile.id,
              "OrthoCross Reminder",
              message
            );

            if (sendResult.success) {
              // Log the notification (uses unique constraint for dedup)
              const { error: logError } = await supabase.from('notification_log').insert({
                user_id: profile.id,
                type: 'streak_6pm',
                local_date: localTime.dateStr,
              });
              
              if (logError && logError.code === '23505') {
                // Duplicate key - already sent (race condition)
                counters.skippedDup++;
              } else {
                counters.sentStreak++;
                console.log(`[streak] Sent to ${profile.id.substring(0, 8)}...`);
              }
            } else {
              counters.oneSignalFailed++;
            }
          }
        }
      }

      // ========== FASTING NOTIFICATIONS at 20:00 (8pm) local time ==========
      const isFastingTime = localTime.hour === 20 && localTime.minute < 5;
      
      if (!isFastingTime) {
        // Wrong time for this user's fasting notification
        if (isStreakTime || isFastingTime) {
          // Already counted in streak section if applicable
        }
      } else if (!profile.fasting_notifications_enabled) {
        counters.skippedPrefsOff++;
      } else {
        // Check if notification already sent today (dedup)
        const { data: existingLog } = await supabase
          .from('notification_log')
          .select('id')
          .eq('user_id', profile.id)
          .eq('type', 'fasting_8pm')
          .eq('local_date', localTime.dateStr)
          .maybeSingle();

        if (existingLog) {
          counters.skippedDup++;
        } else {
          // Check if tomorrow has a fast/feast in calendar
          const { data: calendarEvent } = await supabase
            .from('fast_calendar')
            .select('label, is_fast')
            .eq('date', tomorrowDate)
            .maybeSingle();

          if (!calendarEvent) {
            // No event tomorrow, no need to notify
            counters.skippedWrongTime++; // Reusing as "no event" skip
          } else {
            const message = calendarEvent.is_fast
              ? `🕊️ ${calendarEvent.label} begins tomorrow. Prepare to observe the fast.`
              : `✨ ${calendarEvent.label} is tomorrow. Prepare for the feast!`;

            // Send notification
            const sendResult = await sendOneSignalNotification(
              profile.id,
              calendarEvent.is_fast ? "Upcoming Fast" : "Upcoming Feast",
              message
            );

            if (sendResult.success) {
              // Log the notification
              const { error: logError } = await supabase.from('notification_log').insert({
                user_id: profile.id,
                type: 'fasting_8pm',
                local_date: localTime.dateStr,
              });
              
              if (logError && logError.code === '23505') {
                counters.skippedDup++;
              } else {
                counters.sentFasting++;
                console.log(`[fasting] Sent to ${profile.id.substring(0, 8)}... for ${calendarEvent.label}`);
              }
            } else {
              counters.oneSignalFailed++;
            }
          }
        }
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
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[send-scheduled-reminders] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
