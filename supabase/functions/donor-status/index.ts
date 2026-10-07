import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { lifetimeTotal } from "../_shared/donorStats.ts";
import { getNextTier, getTier } from "../_shared/donorTiers.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: { user } } = await admin.auth.getUser(auth.slice(7));
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const since = typeof body.since === "string" && !isNaN(Date.parse(body.since)) ? body.since : null;

  const total = await lifetimeTotal(admin, user.id);
  const tier = getTier(total);
  const next = getNextTier(total);

  // Latest confirmed donation (optionally only those made after `since`) for the celebration screen
  let q = admin.from("donations").select("id, amount, created_at").eq("user_id", user.id).eq("status", "confirmed")
    .order("created_at", { ascending: false }).limit(1);
  if (since) q = q.gte("created_at", since);
  const { data: latest } = await q.maybeSingle();
  let previousTierKey: string | null = null;
  if (latest) previousTierKey = getTier(await lifetimeTotal(admin, user.id, latest.id))?.key ?? null;

  const { data: p } = await admin.from("profiles").select("display_name, username, donor_anonymous").eq("id", user.id).maybeSingle();

  return json({
    hasDonated: total > 0,
    tierKey: tier?.key ?? null,
    nextTierKey: next?.tier.key ?? null,
    remainingCents: next?.remainingCents ?? 0,
    name: p?.display_name || p?.username || "friend",
    anonymous: !!p?.donor_anonymous,
    latestDonation: latest ? { id: latest.id, created_at: latest.created_at, previousTierKey } : null,
  });
});
