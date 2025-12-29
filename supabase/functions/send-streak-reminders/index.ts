import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time
    const now = new Date();
    const currentHour = now.getUTCHours();
    
    // This function should be called at 6pm local time
    // For simplicity, we check if it's around 18:00 (6pm) in common timezones
    // In production, you'd want timezone-aware scheduling
    console.log(`Sending streak reminder notifications at UTC hour: ${currentHour}`);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get all users with streak notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, streak_notifications_enabled')
      .eq('streak_notifications_enabled', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No users with streak notifications enabled');
      return new Response(
        JSON.stringify({ message: "No users with streak notifications enabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${profiles.length} users with streak notifications enabled`);

    const userIds = profiles.map(p => p.id);

    // Get streak data for these users
    const { data: streaks, error: streaksError } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak, last_activity_date")
      .in("user_id", userIds);

    if (streaksError) {
      console.error('Error fetching streaks:', streaksError);
      throw streaksError;
    }

    // Get completed chapters for today to check if user has done any reading
    const { data: completedToday, error: completedError } = await supabase
      .from("completed_chapters")
      .select("user_id")
      .gte("completed_at", `${today}T00:00:00.000Z`)
      .lt("completed_at", `${today}T23:59:59.999Z`);

    if (completedError) {
      console.error('Error fetching completed chapters:', completedError);
    }

    // Get saints read today
    const { data: saintsToday, error: saintsError } = await supabase
      .from("saints_read")
      .select("user_id")
      .gte("read_at", `${today}T00:00:00.000Z`)
      .lt("read_at", `${today}T23:59:59.999Z`);

    if (saintsError) {
      console.error('Error fetching saints read:', saintsError);
    }

    // Get history islands completed today
    const { data: historyToday, error: historyError } = await supabase
      .from("orthodox_history_progress")
      .select("user_id")
      .eq("completed", true)
      .gte("completed_at", `${today}T00:00:00.000Z`)
      .lt("completed_at", `${today}T23:59:59.999Z`);

    if (historyError) {
      console.error('Error fetching history progress:', historyError);
    }

    // Create a set of users who have completed ANY reading today
    const usersWithReadingToday = new Set<string>();
    completedToday?.forEach(c => usersWithReadingToday.add(c.user_id));
    saintsToday?.forEach(s => usersWithReadingToday.add(s.user_id));
    historyToday?.forEach(h => usersWithReadingToday.add(h.user_id));

    // Filter to users who haven't completed any reading today
    const usersToNotify = profiles.filter(p => !usersWithReadingToday.has(p.id));

    if (usersToNotify.length === 0) {
      console.log('All users have completed readings today');
      return new Response(
        JSON.stringify({ message: "All users have completed readings today" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`${usersToNotify.length} users haven't completed any reading today`);

    // Send notifications via OneSignal
    const notifications = [];
    
    if (oneSignalAppId && oneSignalApiKey) {
      for (const profile of usersToNotify) {
        const userStreak = streaks?.find(s => s.user_id === profile.id);
        const currentStreak = userStreak?.current_streak || 0;
        
        const message = currentStreak > 0
          ? `🔥 Keep Your ${currentStreak}-Day Streak! Don't forget your daily reading to maintain your streak!`
          : `📖 Start Your Reading Streak! Complete a reading today to begin your streak.`;

        try {
          const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${oneSignalApiKey}`,
            },
            body: JSON.stringify({
              app_id: oneSignalAppId,
              include_external_user_ids: [profile.id],
              contents: { en: message },
              headings: { en: "OrthoCross Reminder" },
            }),
          });

          const result = await response.json();
          console.log(`Notification sent to ${profile.id}:`, result);
          
          notifications.push({
            user_id: profile.id,
            success: response.ok,
            result,
          });
        } catch (error: any) {
          console.error(`Error sending notification to ${profile.id}:`, error);
          notifications.push({
            user_id: profile.id,
            success: false,
            error: error.message,
          });
        }
      }
    } else {
      console.log('OneSignal not configured, skipping push notifications');
    }

    return new Response(
      JSON.stringify({ 
        message: "Streak reminders processed",
        users_checked: profiles.length,
        users_with_reading_today: usersWithReadingToday.size,
        notifications_sent: notifications.filter(n => n.success).length,
        results: notifications,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
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