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

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Calculate dates for 1, 2, and 3 days from now
    const oneDayFromNow = new Date(today);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayStr = oneDayFromNow.toISOString().split('T')[0];
    
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const twoDaysStr = twoDaysFromNow.toISOString().split('T')[0];
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    console.log('Checking fasting reminders for:', todayStr, oneDayStr, twoDaysStr, threeDaysStr);

    // Get all reminders for today and next 3 days with phone numbers and user preferences
    const { data: reminders, error: remindersError } = await supabase
      .from("fasting_reminders")
      .select("*, user_phone_numbers!inner(phone_number), profiles!inner(fasting_notifications_enabled, fasting_reminder_days)")
      .or(`event_date.eq.${todayStr},event_date.eq.${oneDayStr},event_date.eq.${twoDaysStr},event_date.eq.${threeDaysStr}`)
      .eq("profiles.fasting_notifications_enabled", true);

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

      // Calculate days until event
      const eventDate = new Date(reminder.event_date);
      const daysUntil = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get user's fasting reminder preferences
      const profileData = reminder.profiles as any;
      const userReminderDays: number[] = profileData?.fasting_reminder_days || [3, 0];
      
      // Skip Monday/Wednesday fasts for advance notifications (only send same day)
      const dayOfWeek = eventDate.getDay(); // 0 = Sunday, 1 = Monday, 3 = Wednesday
      const isMondayOrWednesdayFast = (dayOfWeek === 1 || dayOfWeek === 3) && reminder.event_type === "fast";
      
      if (daysUntil > 0 && isMondayOrWednesdayFast) {
        console.log(`Skipping advance notification for Monday/Wednesday fast: ${reminder.event_name}`);
        continue;
      }
      
      // Check if user wants notifications for this number of days before
      if (!userReminderDays.includes(daysUntil)) {
        console.log(`User doesn't want ${daysUntil}-day advance notification for: ${reminder.event_name}`);
        continue;
      }

      // Generate appropriate message
      let message: string;
      if (daysUntil === 0) {
        message = reminder.event_type === "fast" 
          ? `🕊️ ${reminder.event_name} begins today (${reminder.event_tradition}). Remember to observe the fast.`
          : `✨ Today is ${reminder.event_name} (${reminder.event_tradition}). May you have a blessed feast day!`;
      } else {
        const daysText = daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;
        message = reminder.event_type === "fast"
          ? `🕊️ ${reminder.event_name} begins ${daysText} (${reminder.event_tradition}). Prepare to observe the fast.`
          : `✨ ${reminder.event_name} is ${daysText} (${reminder.event_tradition}). Prepare for the feast!`;
      }

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