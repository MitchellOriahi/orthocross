import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * send-leaderboard-notification
 *
 * This edge function delivers notifications to users when someone overtakes
 * them on a group leaderboard. The request body should include an array of
 * user IDs that were passed (`passed_user_ids`), the current user's name
 * (`current_user_name`) and optionally the group's name (`group_name`).
 *
 * Uses external_user_ids (Supabase user UUID) for OneSignal targeting.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { passed_user_ids, current_user_name, group_name } = await req.json();

    if (!Array.isArray(passed_user_ids) || passed_user_ids.length === 0 || !current_user_name) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch profiles to check notification preferences
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, leaderboard_notifications_enabled")
      .in("id", passed_user_ids);

    if (profilesError) {
      console.error(profilesError);
      return new Response(
        JSON.stringify({ ok: false, error: "Failed to fetch profiles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter to users who have leaderboard notifications enabled
    const recipients: string[] = [];
    for (const p of profiles ?? []) {
      if (p && p.leaderboard_notifications_enabled !== false) {
        recipients.push(p.id);
      }
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "No recipients to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error("Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY env var");
    }

    const message = group_name
      ? `${current_user_name} just surpassed you in the ${group_name} leaderboard! Keep going!`
      : `${current_user_name} just surpassed you on the leaderboard! Keep going!`;

    // Use external_user_ids (Supabase UUID) instead of player_ids
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: recipients,
      headings: { en: "Leaderboard Update 📊" },
      contents: { en: message },
      data: {
        type: "leaderboard_surpass",
        current_user_name,
        group_name: group_name ?? null,
      },
    };

    const resp = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("OneSignal error", text);
      return new Response(
        JSON.stringify({ ok: false, error: "Failed to send notifications" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await resp.json();
    console.log(`[leaderboard] Sent to ${recipients.length} users for ${current_user_name}`);
    
    return new Response(
      JSON.stringify({ ok: true, count: recipients.length, recipients: result.recipients || 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
