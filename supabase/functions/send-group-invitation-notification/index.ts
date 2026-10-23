import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPush } from "../_shared/oneSignal.ts";
import { isUuid } from "../_shared/relationships.ts";

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

    const { to_user_id, group_id } = await req.json();
    if (!isUuid(to_user_id) || (group_id != null && !isUuid(group_id))) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const forbidden = () => new Response(JSON.stringify({ ok: false, error: "Not allowed" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // The caller must have a pending invitation out to the recipient...
    let inviteQuery = admin.from("group_invitations").select("id, group_id")
      .eq("inviter_id", senderId).eq("invitee_id", to_user_id).eq("status", "pending");
    if (group_id) inviteQuery = inviteQuery.eq("group_id", group_id);
    const { data: invites } = await inviteQuery.order("created_at", { ascending: false }).limit(1);
    const invitation = invites?.[0];
    if (!invitation) return forbidden();

    // ...and still belong to that group.
    const { data: membership } = await admin.from("group_members").select("role")
      .eq("group_id", invitation.group_id).eq("user_id", senderId).maybeSingle();
    if (!membership) return forbidden();

    // One push per invitation per day, however often this is called.
    const { error: logErr } = await admin.from("notification_log").insert({
      user_id: to_user_id,
      type: `group_invite:${invitation.id}`,
      local_date: new Date().toISOString().split("T")[0],
    });
    if (logErr) {
      return new Response(JSON.stringify({ ok: true, message: "Already notified" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: senderProfile } = await admin.from("profiles")
      .select("username, display_name").eq("id", senderId).single();
    const from_user_name = senderProfile?.display_name || senderProfile?.username || "Someone";

    const { data: g } = await admin.from("groups").select("name").eq("id", invitation.group_id).single();
    const group_name = g?.name || "a group";

    const { data: profile } = await admin.from("profiles")
      .select("friends_notifications_enabled").eq("id", to_user_id).single();
    if (profile?.friends_notifications_enabled === false) {
      return new Response(JSON.stringify({ ok: true, message: "Disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const content = `${from_user_name} invited you to join "${group_name}"! Will you accept?`;
    const sent = await sendPush([to_user_id], "Group Invitation 👀", content, { path: "/friends" });

    return new Response(JSON.stringify({ ok: true, sent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
