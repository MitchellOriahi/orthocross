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

// Fasting events data - major Eastern and Oriental Orthodox fasts and feasts
const getFastingEvents = (year: number) => {
  // This is a simplified list - in production you'd have a complete calendar
  return [
    // Major Eastern Orthodox events
    { name: "Great Lent", month: 3, day: 18, tradition: "Eastern", type: "fast", isMajor: true },
    { name: "Pascha (Easter)", month: 5, day: 5, tradition: "Eastern", type: "feast", isMajor: true },
    { name: "Apostles' Fast", month: 6, day: 24, tradition: "Eastern", type: "fast", isMajor: true },
    { name: "Dormition Fast", month: 8, day: 1, tradition: "Eastern", type: "fast", isMajor: true },
    { name: "Dormition of the Theotokos", month: 8, day: 15, tradition: "Eastern", type: "feast", isMajor: true },
    { name: "Nativity Fast", month: 11, day: 15, tradition: "Eastern", type: "fast", isMajor: true },
    { name: "Nativity of Christ", month: 12, day: 25, tradition: "Eastern", type: "feast", isMajor: true },
    { name: "Theophany", month: 1, day: 6, tradition: "Eastern", type: "feast", isMajor: true },
    { name: "Transfiguration", month: 8, day: 6, tradition: "Eastern", type: "feast", isMajor: true },
    { name: "Exaltation of the Cross", month: 9, day: 14, tradition: "Eastern", type: "feast", isMajor: true },
    
    // Major Oriental Orthodox events
    { name: "Great Lent (Coptic)", month: 2, day: 25, tradition: "Oriental", type: "fast", isMajor: true },
    { name: "Resurrection (Coptic)", month: 4, day: 20, tradition: "Oriental", type: "feast", isMajor: true },
    { name: "Apostles' Fast (Coptic)", month: 7, day: 1, tradition: "Oriental", type: "fast", isMajor: true },
    { name: "St. Mary's Fast", month: 8, day: 7, tradition: "Oriental", type: "fast", isMajor: true },
    { name: "Assumption of Mary", month: 8, day: 22, tradition: "Oriental", type: "feast", isMajor: true },
    { name: "Advent Fast (Coptic)", month: 11, day: 25, tradition: "Oriental", type: "fast", isMajor: true },
    { name: "Nativity (Coptic)", month: 1, day: 7, tradition: "Oriental", type: "feast", isMajor: true },
  ];
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // This function should be called at 8pm to send notifications for tomorrow's events
    const now = new Date();
    console.log(`Checking fasting notifications at: ${now.toISOString()}`);

    // Get tomorrow's date
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowMonth = tomorrow.getMonth() + 1; // JavaScript months are 0-indexed
    const tomorrowDay = tomorrow.getDate();
    const currentYear = tomorrow.getFullYear();

    console.log(`Looking for events on: ${tomorrowMonth}/${tomorrowDay}/${currentYear}`);

    // Get events that start tomorrow
    const allEvents = getFastingEvents(currentYear);
    const tomorrowEvents = allEvents.filter(e => 
      e.month === tomorrowMonth && e.day === tomorrowDay && e.isMajor
    );

    if (tomorrowEvents.length === 0) {
      console.log('No major fasting events tomorrow');
      return new Response(
        JSON.stringify({ message: "No major fasting events tomorrow" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${tomorrowEvents.length} events for tomorrow:`, tomorrowEvents.map(e => e.name));

    // Get all users with fasting notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, fasting_notifications_enabled')
      .eq('fasting_notifications_enabled', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No users with fasting notifications enabled');
      return new Response(
        JSON.stringify({ message: "No users with fasting notifications enabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${profiles.length} users with fasting notifications enabled`);

    // Send notifications via OneSignal
    const notifications = [];

    if (oneSignalAppId && oneSignalApiKey) {
      for (const event of tomorrowEvents) {
        const message = event.type === "fast"
          ? `🕊️ ${event.name} begins tomorrow (${event.tradition} Orthodox). Prepare to observe the fast.`
          : `✨ ${event.name} is tomorrow (${event.tradition} Orthodox). Prepare for the feast!`;

        const userIds = profiles.map(p => p.id);

        try {
          const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${oneSignalApiKey}`,
            },
            body: JSON.stringify({
              app_id: oneSignalAppId,
              include_external_user_ids: userIds,
              contents: { en: message },
              headings: { en: event.type === "fast" ? "Upcoming Fast" : "Upcoming Feast" },
            }),
          });

          const result = await response.json();
          console.log(`Notification sent for ${event.name}:`, result);

          notifications.push({
            event: event.name,
            users_notified: userIds.length,
            success: response.ok,
            result,
          });
        } catch (error: any) {
          console.error(`Error sending notification for ${event.name}:`, error);
          notifications.push({
            event: event.name,
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
        message: "Fasting notifications processed",
        events_found: tomorrowEvents.length,
        users_to_notify: profiles.length,
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