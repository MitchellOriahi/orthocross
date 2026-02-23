import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendOneSignalNotification(
  appId: string,
  apiKey: string,
  externalUserIds: string[],
  title: string,
  body: string
): Promise<number> {
  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_external_user_ids: externalUserIds,
      headings: { en: title },
      contents: { en: body },
    }),
  });
  const result = await response.json();
  return result.recipients || 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { passed_user_ids, current_user_name, group_name } = await req.json();
    if (!Array.isArray(passed_user_ids) || !passed_user_ids.length || !current_user_name) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: profiles } = await supabase.from("profiles").select("id, leaderboard_notifications_enabled").in("id", passed_user_ids);
    const recipients = (profiles ?? []).filter(p => p.leaderboard_notifications_enabled !== false).map(p => p.id);

    if (!recipients.length) {
      return new Response(JSON.stringify({ ok: true, message: "No recipients" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) throw new Error("OneSignal not configured");

    const message = group_name
      ? `${current_user_name} just surpassed you in the ${group_name} leaderboard! Keep going!`
      : `${current_user_name} just surpassed you on the leaderboard! Keep going!`;

    const sent = await sendOneSignalNotification(ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, recipients, "Leaderboard Update 📊", message);

    console.log(`[leaderboard] Sent to ${recipients.length} users (${sent} recipients)`);
    return new Response(JSON.stringify({ ok: true, count: recipients.length, sent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
