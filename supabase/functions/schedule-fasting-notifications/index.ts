import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FastingEvent {
  name: string;
  date: string;
  tradition: string;
  type: "fast" | "feast";
}

const majorEvents: FastingEvent[] = [
  { name: "Nativity Fast", date: "2025-11-15", tradition: "Eastern Orthodox", type: "fast" },
  { name: "Nativity of Christ", date: "2025-12-25", tradition: "Eastern Orthodox", type: "feast" },
  { name: "Theophany (Epiphany)", date: "2026-01-06", tradition: "Eastern Orthodox", type: "feast" },
  { name: "Nativity Fast", date: "2025-11-25", tradition: "Oriental Orthodox", type: "fast" },
  { name: "Nativity of Christ", date: "2026-01-07", tradition: "Oriental Orthodox", type: "feast" },
  { name: "Nineveh Fast", date: "2025-02-03", tradition: "Oriental Orthodox", type: "fast" },
  { name: "Great Lent", date: "2025-02-10", tradition: "Oriental Orthodox", type: "fast" },
  { name: "Great Lent", date: "2025-03-03", tradition: "Eastern Orthodox", type: "fast" },
  { name: "Annunciation", date: "2025-03-25", tradition: "Eastern Orthodox", type: "feast" },
  { name: "Palm Sunday", date: "2025-04-13", tradition: "Eastern Orthodox", type: "feast" },
  { name: "Pascha (Easter)", date: "2025-04-20", tradition: "Eastern Orthodox", type: "feast" },
  { name: "Ascension", date: "2025-05-29", tradition: "Eastern Orthodox", type: "feast" },
  { name: "Pentecost", date: "2025-06-08", tradition: "Eastern Orthodox", type: "feast" },
  { name: "Apostles' Fast", date: "2025-06-15", tradition: "Eastern Orthodox", type: "fast" },
  { name: "Apostles' Fast", date: "2025-06-16", tradition: "Oriental Orthodox", type: "fast" },
  { name: "Transfiguration", date: "2025-08-06", tradition: "Eastern Orthodox", type: "feast" },
  { name: "Dormition Fast", date: "2025-08-01", tradition: "Eastern Orthodox", type: "fast" },
  { name: "Dormition Fast", date: "2025-08-07", tradition: "Oriental Orthodox", type: "fast" },
  { name: "Dormition of Theotokos", date: "2025-08-15", tradition: "Eastern Orthodox", type: "feast" },
  { name: "Nativity of Theotokos", date: "2025-09-08", tradition: "Eastern Orthodox", type: "feast" },
  { name: "Elevation of the Cross", date: "2025-09-14", tradition: "Eastern Orthodox", type: "feast" },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with phone numbers
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, phone_number")
      .not("phone_number", "is", null);

    if (profilesError) throw profilesError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check which events are happening today
    const todaysEvents = majorEvents.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });

    if (todaysEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No events today" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send SMS to all users for each event
    const notifications = [];
    for (const event of todaysEvents) {
      const message = event.type === "fast" 
        ? `${event.name} begins today (${event.tradition}). Remember to observe the fast.`
        : `Today is ${event.name} (${event.tradition}). May you have a blessed feast day!`;

      for (const profile of profiles || []) {
        if (profile.phone_number) {
          // Call the SMS function
          const smsResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-sms-notification`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                to: profile.phone_number,
                message: message,
              }),
            }
          );

          notifications.push({
            user_id: profile.id,
            event: event.name,
            success: smsResponse.ok,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Notifications processed",
        events: todaysEvents.length,
        notifications: notifications.length,
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
