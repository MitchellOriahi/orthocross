import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * send-reaction-notification
 *
 * This edge function accepts a POST request containing the recipient user ID,
 * the name of the user who reacted and optionally the title of the achievement.
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
    const { to_user_id, from_user_name, achievement_title } = await req.json();

    // Validate input
    if (!to_user_id || !from_user_name) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing to_user_id or from_user_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the recipient's notification preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("reaction_notifications_enabled")
      .eq("id", to_user_id)
      .single();

    if (profileError || !profile) {
      console.error("Profile lookup failed", profileError);
      return new Response(
        JSON.stringify({ ok: false, error: "Recipient not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.reaction_notifications_enabled === false) {
      // Respect user's notification preferences
      return new Response(
        JSON.stringify({ ok: true, message: "Recipient has disabled reaction notifications" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    
    console.log(`[reaction] OneSignal App ID exists: ${!!ONESIGNAL_APP_ID}, API Key exists: ${!!ONESIGNAL_REST_API_KEY}`);
    
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error("[reaction] Missing OneSignal credentials");
      return new Response(
        JSON.stringify({ ok: false, error: "OneSignal not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = achievement_title 
      ? `${from_user_name} reacted to your achievement: ${achievement_title}!`
      : `${from_user_name} reacted to your achievement!`;

    // Use external_user_ids (Supabase UUID) instead of player_ids
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [to_user_id],
      headings: { en: "New Reaction 🎉" },
      contents: { en: content },
      data: {
        type: "reaction",
        from_user_name,
        achievement_title: achievement_title ?? null,
      },
    };

    // Send the notification via OneSignal
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OneSignal error", text);
      return new Response(
        JSON.stringify({ ok: false, error: "Failed to send notification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log(`[reaction] Sent to ${to_user_id.substring(0, 8)}... from ${from_user_name}`);
    
    return new Response(
      JSON.stringify({ ok: true, recipients: result.recipients || 0 }),
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
