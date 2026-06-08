import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function sendOneSignalNotification(
  appId: string, apiKey: string, externalUserId: string, title: string, body: string
): Promise<number> {
  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${apiKey}` },
    body: JSON.stringify({
      app_id: appId,
      include_external_user_ids: [externalUserId],
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authedClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await authedClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const senderId = claimsData.claims.sub as string;

    const { type, to_user_id } = await req.json();
    if (!type || !to_user_id || typeof to_user_id !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Resolve sender name server-side from authenticated user
    const { data: senderProfile } = await admin.from("profiles")
      .select("username, display_name").eq("id", senderId).single();
    const from_user_name = senderProfile?.display_name || senderProfile?.username || "Someone";

    const { data: profile } = await admin.from("profiles")
      .select("friends_notifications_enabled").eq("id", to_user_id).single();
    if (profile?.friends_notifications_enabled === false) {
      return new Response(JSON.stringify({ ok: true, message: "Disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) throw new Error("OneSignal not configured");

    const messages = type === 'accepted' ? FRIEND_ACCEPTED_MESSAGES : FRIEND_REQUEST_MESSAGES;
    const heading = type === 'accepted' ? "Friend Request Accepted! 🎉" : "New Friend Request 👋";
    const content = `${from_user_name} ${messages[Math.floor(Math.random() * messages.length)]}`;

    const sent = await sendOneSignalNotification(ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, to_user_id, heading, content);

    return new Response(JSON.stringify({ ok: true, sent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
