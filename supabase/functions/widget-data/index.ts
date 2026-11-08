// Home screen widget data: streak, full Verse of the Day and today's Orthodox
// observance, with light and dark colors. Accepts either a revocable read-only
// widget key (ocw_...) issued by `widget-token`, or a normal signed-in token.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { buildWidgetSnapshot, isValidTimeZone, localDateIn, DEFAULT_TIMEZONE } from "./snapshot.ts";
import { WIDGET_TOKEN_PREFIX, hashWidgetToken, isWidgetTokenShape } from "../_shared/widgetTokens.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!bearer) return json({ error: "Missing authorization" }, 401);

  let userId: string | null = null;
  if (bearer.startsWith(WIDGET_TOKEN_PREFIX)) {
    if (!isWidgetTokenShape(bearer)) return json({ error: "Unauthorized" }, 401);
    const { data: row } = await admin
      .from("widget_tokens")
      .select("id, user_id, last_used_at")
      .eq("token_hash", await hashWidgetToken(bearer))
      .is("revoked_at", null)
      .maybeSingle();
    if (!row) return json({ error: "Unauthorized" }, 401);
    userId = row.user_id;
    const stale = !row.last_used_at || Date.now() - Date.parse(row.last_used_at) > 60 * 60 * 1000;
    if (stale) await admin.from("widget_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", row.id);
  } else {
    const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await authClient.auth.getUser(bearer);
    if (error || !data.user) return json({ error: "Unauthorized" }, 401);
    userId = data.user.id;
  }

  // Optional device time zone override (e.g. while travelling); otherwise the account setting.
  let requestedTz: unknown = new URL(req.url).searchParams.get("timezone");
  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body && typeof body === "object" && "timezone" in body) requestedTz = (body as { timezone: unknown }).timezone;
    } catch { /* empty body is fine */ }
  }
  if (requestedTz != null && requestedTz !== "" && !isValidTimeZone(requestedTz)) {
    return json({ error: "Invalid timezone" }, 400);
  }

  try {
    const [profileRes, tagsRes, streakRes] = await Promise.all([
      admin.from("profiles").select("timezone, calendar_system, calendar_tradition").eq("id", userId).maybeSingle(),
      admin.from("profile_identity_tags").select("branch").eq("user_id", userId).maybeSingle(),
      admin.from("user_streaks").select("current_streak, longest_streak, last_activity_date, guardian_last_save_month").eq("user_id", userId).maybeSingle(),
    ]);
    if (profileRes.error) throw profileRes.error;
    if (!profileRes.data) return json({ error: "Profile not found" }, 404);

    const profileTz = isValidTimeZone(profileRes.data.timezone) ? profileRes.data.timezone : DEFAULT_TIMEZONE;
    const timezone = typeof requestedTz === "string" && requestedTz ? requestedTz : profileTz;
    const now = Date.now();

    const { data: verseRows, error: verseError } = await admin.rpc("get_verse_of_the_day", { p_date: localDateIn(timezone, now) });
    if (verseError) throw verseError;
    const verseRow = Array.isArray(verseRows) ? verseRows[0] : verseRows;

    const snapshot = buildWidgetSnapshot({
      now,
      timezone,
      streak: streakRes.data ?? null,
      verse: verseRow ? { reference: verseRow.reference, text: verseRow.verse_text } : null,
      branch: tagsRes.data?.branch ?? null,
      calendarTradition: profileRes.data.calendar_tradition,
      calendarSystem: profileRes.data.calendar_system,
    });
    return json(snapshot);
  } catch (error) {
    console.error("[widget-data]", error);
    return json({ error: "Could not load widget data" }, 500);
  }
});
