import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * send-group-invitation-notification
 *
 * Sends push notifications when a user is invited to a group.
 *
 * Request body:
 * - to_user_id: UUID of the recipient
 * - from_user_name: Display name of the inviter
 * - group_name: Name of the group
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
    const { to_user_id, from_user_name, group_name } = await req.json();

    // Validate input
    if (!to_user_id || !from_user_name || !group_name) {
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

    // Fetch the recipient's notification preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("friends_notifications_enabled")
      .eq("id", to_user_id)
      .single();

    if (profileError || !profile) {
      console.error("Profile lookup failed", profileError);
      return new Response(
        JSON.stringify({ ok: false, error: "Recipient not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Respect user's notification preferences (group invites fall under friends notifications)
    if (profile.friends_notifications_enabled === false) {
      return new Response(
        JSON.stringify({ ok: true, message: "Recipient has disabled group notifications" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error("Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY env var");
    }

    const content = `${from_user_name} invited you to join "${group_name}"! Will you accept?`;

    // Send via OneSignal using external user ID
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [to_user_id],
      headings: { en: "Group Invitation 👀" },
      contents: { en: content },
      data: {
        type: "group_invitation",
        from_user_name,
        group_name,
      },
    };

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
    console.log(`[group-invitation] Sent to ${to_user_id.substring(0, 8)}... for group "${group_name}"`);
    
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
