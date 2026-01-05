import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

/**
 * send-reaction-notification
 *
 * This edge function accepts a POST request containing the recipient user ID,
 * the name of the user who reacted and optionally the title of the achievement.
 * It looks up the recipient's OneSignal player ID in the profiles table and
 * sends a push notification using the OneSignal REST API. If the recipient
 * does not have a player ID or has disabled notifications it returns an
 * appropriate response.
 */
serve(async (req) => {
  try {
    const { to_user_id, from_user_name, achievement_title } = await req.json();

    // Validate input
    if (!to_user_id || !from_user_name) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing to_user_id or from_user_name" }),
        { status: 400 },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the recipient's OneSignal player ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("onesignal_player_id, reaction_notifications_enabled")
      .eq("id", to_user_id)
      .single();

    if (profileError || !profile) {
      console.error("Profile lookup failed", profileError);
      return new Response(
        JSON.stringify({ ok: false, error: "Recipient not found" }),
        { status: 400 },
      );
    }

    if (profile.reaction_notifications_enabled === false) {
      // Respect user's notification preferences
      return new Response(
        JSON.stringify({ ok: true, message: "Recipient has disabled reaction notifications" }),
        { status: 200 },
      );
    }

    const playerId: string | null = profile.onesignal_player_id;
    if (!playerId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Recipient has no OneSignal player ID" }),
        { status: 400 },
      );
    }

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error("Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY env var");
    }

    const content = from_user_name + " reacted to your achievement" + (achievement_title ? ": " + achievement_title : "") + "!";
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [playerId],
      headings: { en: "New reaction" },
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
        Authorization: "Basic " + ONESIGNAL_REST_API_KEY,
      },
      body: JSON.stringify(notificationPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OneSignal error", text);
      return new Response(
        JSON.stringify({ ok: false, error: "Failed to send notification" }),
        { status: 500 },
      );
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid request" }),
      { status: 400 },
    );
  }
});
