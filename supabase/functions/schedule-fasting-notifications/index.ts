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

    // This function should run at 8pm to notify users about tomorrow's fasts/feasts
    const currentHour = new Date().getHours();
    console.log('Current hour:', currentHour);

    if (currentHour !== 20) {
      console.log('Not 8pm yet, skipping fasting notifications');
      return new Response(
        JSON.stringify({ message: "Fasting notifications only run at 8pm", currentHour }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Sending fasting notifications at 8pm for tomorrow\'s events');

    // Get tomorrow's date (the night before)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log('Checking fasting reminders for events on:', tomorrowStr);

    // Get all reminders for tomorrow with user preferences
    const { data: reminders, error: remindersError } = await supabase
      .from("fasting_reminders")
      .select("*, profiles!inner(fasting_notifications_enabled)")
      .eq("event_date", tomorrowStr)
      .eq("profiles.fasting_notifications_enabled", true);

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      console.log('No fasting events tomorrow');
      return new Response(
        JSON.stringify({ message: "No fasting events tomorrow", date: tomorrowStr }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${reminders.length} reminders for tomorrow's events`);

    // Get phone numbers from auth metadata
    const userIds = [...new Set(reminders.map(r => r.user_id))];
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

    // Send SMS to all users with reminders
    const notifications = [];
    for (const reminder of reminders) {
      const phoneNumber = phoneMap.get(reminder.user_id);
      
      if (!phoneNumber) {
        console.log(`User ${reminder.user_id} has no phone number, skipping`);
        continue;
      }

      // Generate appropriate message for tomorrow's event
      const message = reminder.event_type === "fast"
        ? `🕊️ ${reminder.event_name} begins tomorrow (${reminder.event_tradition}). Prepare to observe the fast.`
        : `✨ ${reminder.event_name} is tomorrow (${reminder.event_tradition}). Prepare for the feast!`;

      console.log(`Sending SMS to ${phoneNumber} for event: ${reminder.event_name}`);

      // Call the SMS function
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
            user_id: reminder.user_id,
            event: reminder.event_name,
            success: false,
            error: smsResponse.error.message,
          });
        } else {
          console.log('SMS sent successfully:', smsResponse.data);
          notifications.push({
            user_id: reminder.user_id,
            event: reminder.event_name,
            success: true,
          });
        }
      } catch (error: any) {
        console.error('Error invoking SMS function:', error);
        notifications.push({
          user_id: reminder.user_id,
          event: reminder.event_name,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Fasting notifications processed at 8pm",
        date: tomorrowStr,
        reminders_found: reminders.length,
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