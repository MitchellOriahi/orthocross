import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ ok: false, error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) return json({ ok: false, error: "Unauthorized" }, 401);
    const senderId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const toUserId = body?.to_user_id;
    if (typeof toUserId !== "string" || !/^[0-9a-f-]{36}$/i.test(toUserId) || toUserId === senderId) {
      return json({ ok: false, error: "Invalid recipient" }, 400);
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Must be friends or share a group
    const { data: friendRows } = await admin.from("friends").select("id")
      .or(`and(user_id.eq.${senderId},friend_id.eq.${toUserId}),and(user_id.eq.${toUserId},friend_id.eq.${senderId})`)
      .limit(1);
    let allowed = (friendRows?.length ?? 0) > 0;
    if (!allowed) {
      const { data: mine } = await admin.from("group_members").select("group_id").eq("user_id", senderId);
      const ids = (mine ?? []).map((r) => r.group_id);
      if (ids.length) {
        const { data: shared } = await admin.from("group_members").select("id")
          .eq("user_id", toUserId).in("group_id", ids).limit(1);
        allowed = (shared?.length ?? 0) > 0;
      }
    }
    if (!allowed) return json({ ok: false, error: "Not allowed" }, 403);

    const { error: insErr } = await admin.from("streak_nudges").insert({ sender_id: senderId, receiver_id: toUserId });
    if (insErr) {
      if (insErr.code === "23505") return json({ ok: false, error: "already_nudged" }, 200);
      throw insErr;
    }

    const { data: sender } = await admin.from("profiles").select("username, display_name").eq("id", senderId).single();
    const name = sender?.display_name || sender?.username || "A friend";

    const appId = Deno.env.get("ONESIGNAL_APP_ID");
    const apiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (appId && apiKey) {
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${apiKey}` },
        body: JSON.stringify({
          app_id: appId,
          include_external_user_ids: [toUserId],
          headings: { en: "Don't forget your streak! 🔥" },
          contents: { en: `${name} nudged you to keep your streak going today.` },
        }),
      }).catch((e) => console.error("OneSignal", e));
    }
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "Server error" }, 500);
  }
});
