import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPush } from "../_shared/oneSignal.ts";
import { areFriends, isUuid } from "../_shared/relationships.ts";

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
    const { data: { user: authedUser }, error: claimsErr } = await authedClient.auth.getUser();
    if (claimsErr || !authedUser) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const senderId = authedUser.id;

    const { type, to_user_id } = await req.json();
    if (!type || !isUuid(to_user_id) || to_user_id === senderId) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Only notify about a real pending request from the caller, or a real friendship on accept
    let allowed: boolean;
    if (type === "accepted") {
      allowed = await areFriends(admin, senderId, to_user_id);
    } else {
      const { data: pending } = await admin.from("friend_requests").select("id")
        .eq("sender_id", senderId).eq("receiver_id", to_user_id).eq("status", "pending").limit(1);
      allowed = (pending?.length ?? 0) > 0;
    }
    if (!allowed) {
      return new Response(JSON.stringify({ ok: false, error: "Not allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    const messages = type === 'accepted' ? FRIEND_ACCEPTED_MESSAGES : FRIEND_REQUEST_MESSAGES;
    const heading = type === 'accepted' ? "Friend Request Accepted! 🎉" : "New Friend Request 👋";
    const content = `${from_user_name} ${messages[Math.floor(Math.random() * messages.length)]}`;

    const sent = await sendPush([to_user_id], heading, content, { path: "/friends" });

    return new Response(JSON.stringify({ ok: true, sent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
