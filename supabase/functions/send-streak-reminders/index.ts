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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Sending streak reminder notifications');

    // Get all users with streak notifications enabled who have phone numbers
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, user_phone_numbers!inner(phone_number)")
      .eq("streak_notifications_enabled", true);

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

    // Get streak data for these users
    const userIds = profiles.map(p => p.id);
    const { data: streaks, error: streaksError } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak, last_activity_date")
      .in("user_id", userIds);

    if (streaksError) {
      console.error('Error fetching streaks:', streaksError);
      throw streaksError;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Send SMS to users who haven't completed their reading today
    const notifications = [];
    for (const profile of profiles) {
      const phoneData = profile.user_phone_numbers as any;
      
      if (!phoneData?.phone_number) {
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

      console.log(`Sending SMS to ${phoneData.phone_number}`);

      try {
        const smsResponse = await supabase.functions.invoke('send-sms-notification', {
          body: {
            to: phoneData.phone_number,
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
