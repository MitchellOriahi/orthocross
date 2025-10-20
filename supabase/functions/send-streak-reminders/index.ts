import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    // Verify authorization token for scheduled invocation
    const authHeader = req.headers.get("authorization");
    const schedulerSecret = Deno.env.get("SCHEDULER_SECRET_TOKEN");
    
    if (!schedulerSecret || authHeader !== `Bearer ${schedulerSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Sending streak reminder notifications');

    // Get current hour to determine which reminders to send
    const currentHour = new Date().getHours();
    console.log('Current hour:', currentHour);

    // Get all users with streak notifications enabled and active reminders at this hour
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, 
        streak_notifications_enabled,
        user_streak_reminders!inner(hour, minute, enabled)
      `)
      .eq('streak_notifications_enabled', true)
      .eq('user_streak_reminders.enabled', true)
      .eq('user_streak_reminders.hour', currentHour);

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

    // Get phone numbers from auth metadata
    const userIds = profiles.map(p => p.id);
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw authError;
    }

    // Create phone number map
    const phoneMap = new Map();
    users?.forEach(user => {
      if (user.user_metadata?.phone_number && userIds.includes(user.id)) {
        phoneMap.set(user.id, user.user_metadata.phone_number);
      }
    });

    // Get streak data for these users
    const { data: streaks, error: streaksError } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak, last_activity_date")
      .in("user_id", userIds);

    if (streaksError) {
      console.error('Error fetching streaks:', streaksError);
      throw streaksError;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Send SMS to users who haven't completed their reading today and have a reminder at this hour
    const notifications = [];
    for (const profile of profiles) {
      const phoneNumber = phoneMap.get(profile.id);
      
      if (!phoneNumber) {
        console.log(`User ${profile.id} has no phone number, skipping`);
        continue;
      }

      const userStreak = streaks?.find(s => s.user_id === profile.id);
      const lastActivityDate = userStreak?.last_activity_date;
      
      // Only send if they haven't completed reading today
      if (lastActivityDate === today) {
        console.log(`User ${profile.id} already completed reading today, skipping`);
        continue;
      }

      const currentStreak = userStreak?.current_streak || 0;
      const message = currentStreak > 0
        ? `🔥 Keep Your ${currentStreak}-Day Streak! Don't forget your daily Bible reading to maintain your streak! - OrthoCross App`
        : `📖 Start Your Reading Streak! Complete your daily Bible reading today. - OrthoCross App`;

      console.log(`Sending SMS to ${phoneNumber}`);

      try {
        const smsResponse = await supabase.functions.invoke('send-sms-notification', {
          body: {
            to: phoneNumber,
            message: message,
          },
        });

        if (smsResponse.error) {
          console.error('SMS error:', smsResponse.error);
          notifications.push({
            user_id: profile.id,
            success: false,
            error: smsResponse.error.message,
          });
        } else {
          console.log('SMS sent successfully:', smsResponse.data);
          notifications.push({
            user_id: profile.id,
            success: true,
          });
        }
      } catch (error: any) {
        console.error('Error invoking SMS function:', error);
        notifications.push({
          user_id: profile.id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Streak reminders processed",
        users_checked: profiles.length,
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
