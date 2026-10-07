import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { DONOR_TEXT, getTier } from "../_shared/donorTiers.ts";

// Public leaderboard: ranks and tiers only, never amounts.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const { data: rows, error } = await admin.from("donations").select("user_id, amount, refunded_amount, created_at").eq("status", "confirmed");
  if (error) return new Response(JSON.stringify({ error: "Failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const life = new Map<string, number>();
  const month = new Map<string, number>();
  for (const r of rows ?? []) {
    const net = Math.max(0, r.amount - (r.refunded_amount ?? 0));
    life.set(r.user_id, (life.get(r.user_id) ?? 0) + net);
    if (r.created_at >= monthStart) month.set(r.user_id, (month.get(r.user_id) ?? 0) + net);
  }

  const ids = [...life.keys()];
  const { data: profiles } = ids.length
    ? await admin.from("profiles").select("id, username, display_name, profile_picture_url, donor_anonymous").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const build = (m: Map<string, number>) =>
    [...m.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([id], i) => {
      const p: any = byId.get(id);
      const anon = !p || p.donor_anonymous;
      return {
        rank: i + 1,
        key: anon ? `anon-${i}` : id,
        username: anon ? DONOR_TEXT.anonymousName : (p.username || p.display_name || DONOR_TEXT.anonymousName),
        profile_picture_url: anon ? null : p.profile_picture_url,
        tierKey: getTier(life.get(id) ?? 0)?.key ?? null, // tier is always lifetime-based
      };
    });

  return new Response(JSON.stringify({ month: build(month), lifetime: build(life) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
