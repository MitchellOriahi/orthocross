import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * send-group-invitation-notification
 * Sends push via FCM when a user is invited to a group.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── FCM helpers ────────────────────────────────────────────────────
function base64urlEncode(data: Uint8Array): string {
  let b = ""; for (const byte of data) b += String.fromCharCode(byte);
  return btoa(b).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJwt(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const h = base64urlEncode(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const p = base64urlEncode(enc.encode(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  })));
  const unsigned = `${h}.${p}`;
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), c => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(unsigned));
  return `${unsigned}.${base64urlEncode(new Uint8Array(sig))}`;
}

async function getFcmToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const jwt = await createJwt(sa);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`OAuth: ${JSON.stringify(d)}`);
  return d.access_token;
}

async function sendToUser(supabase: any, accessToken: string, projectId: string, userId: string, title: string, body: string): Promise<number> {
  const { data: tokens } = await supabase.from("push_tokens").select("id, token").eq("user_id", userId);
  if (!tokens?.length) return 0;
  let sent = 0;
  for (const t of tokens) {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { token: t.token, notification: { title, body } } }),
    });
    const res = await r.json();
    if (r.ok) { sent++; } else {
      const code = res?.error?.details?.[0]?.errorCode || "";
      if (code === "UNREGISTERED" || code === "INVALID_ARGUMENT" || r.status === 404) {
        await supabase.from("push_tokens").delete().eq("id", t.id);
      }
    }
  }
  return sent;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to_user_id, from_user_name, group_name } = await req.json();
    if (!to_user_id || !from_user_name || !group_name) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: profile } = await supabase.from("profiles").select("friends_notifications_enabled").eq("id", to_user_id).single();
    if (profile?.friends_notifications_enabled === false) {
      return new Response(JSON.stringify({ ok: true, message: "Disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID");
    const FIREBASE_SA = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!FIREBASE_PROJECT_ID || !FIREBASE_SA) throw new Error("Firebase not configured");

    const sa = JSON.parse(FIREBASE_SA);
    const accessToken = await getFcmToken(sa);

    const content = `${from_user_name} invited you to join "${group_name}"! Will you accept?`;
    const sent = await sendToUser(supabase, accessToken, FIREBASE_PROJECT_ID, to_user_id, "Group Invitation 👀", content);

    console.log(`[group-invitation] Sent to ${to_user_id.substring(0, 8)}... (${sent} devices)`);
    return new Response(JSON.stringify({ ok: true, sent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
