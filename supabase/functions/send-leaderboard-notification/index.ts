import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Leaderboard pushes are now sent server-side by send-scheduled-reminders from
// leaderboard_notifications rows. This endpoint used to let any signed-in user
// push to arbitrary user ids, so it is permanently retired.
serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({ ok: false, error: "Gone" }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
