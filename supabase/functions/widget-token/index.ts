// Issues and revokes read-only home screen widget keys for the signed-in user.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { generateWidgetToken, hashWidgetToken, isWidgetTokenShape } from "../_shared/widgetTokens.ts";

const MAX_ACTIVE_KEYS = 10;

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("issue"), label: z.string().trim().max(60).optional() }),
  z.object({ action: z.literal("revoke"), token: z.string().max(80).optional() }),
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!bearer) return json({ error: "Missing authorization" }, 401);

  const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await authClient.auth.getUser(bearer);
  if (authError || !auth.user) return json({ error: "Unauthorized" }, 401);
  const userId = auth.user.id;

  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date().toISOString();

  try {
    if (parsed.data.action === "issue") {
      const token = generateWidgetToken();
      const { error } = await admin.from("widget_tokens").insert({
        user_id: userId,
        token_hash: await hashWidgetToken(token),
        label: parsed.data.label || null,
      });
      if (error) throw error;

      // Keep only the newest keys active so reinstalls never pile up.
      const { data: active } = await admin
        .from("widget_tokens").select("id")
        .eq("user_id", userId).is("revoked_at", null)
        .order("created_at", { ascending: false });
      const extra = (active ?? []).slice(MAX_ACTIVE_KEYS).map((r) => r.id);
      if (extra.length) await admin.from("widget_tokens").update({ revoked_at: now }).in("id", extra);

      return json({ token, endpoint: `${supabaseUrl}/functions/v1/widget-data` });
    }

    // revoke: one device's key when given, otherwise every key for this account.
    let query = admin.from("widget_tokens").update({ revoked_at: now }).eq("user_id", userId).is("revoked_at", null);
    if (parsed.data.token) {
      if (!isWidgetTokenShape(parsed.data.token)) return json({ error: "Invalid token" }, 400);
      query = query.eq("token_hash", await hashWidgetToken(parsed.data.token));
    }
    const { data, error } = await query.select("id");
    if (error) throw error;
    return json({ revoked: data?.length ?? 0 });
  } catch (error) {
    console.error("[widget-token]", error);
    return json({ error: "Could not update widget access" }, 500);
  }
});
