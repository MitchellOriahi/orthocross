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

    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    console.log('Checking fasting reminders for date:', todayStr);

    // Get all reminders for today with phone numbers from secure table
    const { data: reminders, error: remindersError } = await supabase
      .from("fasting_reminders")
      .select("*, user_phone_numbers!inner(phone_number)")
      .eq("event_date", todayStr);

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      console.log('No reminders for today');
      return new Response(
        JSON.stringify({ message: "No reminders for today", date: todayStr }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${reminders.length} reminders for today`);

    // Send SMS to all users with reminders
    const notifications = [];
    for (const reminder of reminders) {
      const phoneData = reminder.user_phone_numbers as any;
      
      if (!phoneData?.phone_number) {
        console.log(`User ${reminder.user_id} has no phone number, skipping`);
        continue;
      }

      const message = reminder.event_type === "fast" 
        ? `🕊️ ${reminder.event_name} begins today (${reminder.event_tradition}). Remember to observe the fast.`
        : `✨ Today is ${reminder.event_name} (${reminder.event_tradition}). May you have a blessed feast day!`;

      console.log(`Sending SMS to ${phoneData.phone_number} for event: ${reminder.event_name}`);

      // Call the SMS function
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
        message: "Notifications processed",
        date: todayStr,
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