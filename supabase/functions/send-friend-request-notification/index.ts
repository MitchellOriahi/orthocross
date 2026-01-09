import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * send-friend-request-notification
 *
 * Sends push notifications when:
 * 1. A user receives a friend request
 * 2. A user's friend request is accepted
 *
 * Request body:
 * - type: 'request' | 'accepted'
 * - to_user_id: UUID of the recipient
 * - from_user_name: Display name of the sender
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FRIEND_REQUEST_MESSAGES = [
  "wants to be your friend!",
  "sent you a friend request!",
  "wants to connect with you!",
];

const FRIEND_ACCEPTED_MESSAGES = [
  "accepted your friend request!",
  "is now your friend!",
  "wants to read together!",
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to_user_id, from_user_name } = await req.json();

    // Validate input
    if (!type || !to_user_id || !from_user_name) {
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

    // Respect user's notification preferences
    if (profile.friends_notifications_enabled === false) {
      return new Response(
        JSON.stringify({ ok: true, message: "Recipient has disabled friend notifications" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error("Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY env var");
    }

    // Select random message
    const messages = type === 'accepted' ? FRIEND_ACCEPTED_MESSAGES : FRIEND_REQUEST_MESSAGES;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const heading = type === 'accepted' ? "Friend Request Accepted! 🎉" : "New Friend Request 👋";
    const content = `${from_user_name} ${randomMessage}`;

    // Send via OneSignal using external user ID
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [to_user_id],
      headings: { en: heading },
      contents: { en: content },
      data: {
        type: "friend_request",
        subtype: type,
        from_user_name,
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
    console.log(`[friend-request] Sent ${type} notification to ${to_user_id.substring(0, 8)}...`);
    
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
