import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPush } from "../_shared/oneSignal.ts";
import { areConnected, isUuid } from "../_shared/relationships.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authedClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
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

    const { to_user_id, achievement_title } = await req.json();
    if (!isUuid(to_user_id)) {
      return new Response(JSON.stringify({ ok: false, error: "Missing params" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (to_user_id === senderId) {
      return new Response(JSON.stringify({ ok: true, message: "Self" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (!(await areConnected(admin, senderId, to_user_id))) {
      return new Response(JSON.stringify({ ok: false, error: "Not allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: senderProfile } = await admin.from("profiles")
      .select("username, display_name").eq("id", senderId).single();
    const from_user_name = senderProfile?.display_name || senderProfile?.username || "Someone";

    const safeTitle = typeof achievement_title === "string"
      ? achievement_title.slice(0, 120) : null;

    const { data: profile } = await admin.from("profiles")
      .select("reaction_notifications_enabled").eq("id", to_user_id).single();
    if (profile?.reaction_notifications_enabled === false) {
      return new Response(JSON.stringify({ ok: true, message: "Disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const content = safeTitle
      ? `${from_user_name} reacted to your achievement: ${safeTitle}!`
      : `${from_user_name} reacted to your achievement!`;

    const sent = await sendPush([to_user_id], "New Reaction 🎉", content, { path: "/friends" });

    return new Response(JSON.stringify({ ok: true, sent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
