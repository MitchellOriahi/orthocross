import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not signed in" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      auth: { persistSession: false },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) return json({ error: "Not signed in" }, 401);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const LIVE = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);
    const subs: Stripe.Subscription[] = [];
    try {
      const tagged = await stripe.subscriptions.search({ query: `metadata['user_id']:'${user.id}'`, limit: 20 });
      subs.push(...tagged.data);
    } catch (e) { console.error("subscription search failed", e); }
    if (user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 10 });
      for (const c of customers.data) {
        const list = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 20 });
        subs.push(...list.data);
      }
    }
    const live = new Map(subs.filter((s) => LIVE.has(s.status)).map((s) => [s.id, s]));
    if (live.size === 0) return json({ cancelled: 0, error: "No active recurring donation found" }, 404);

    for (const id of live.keys()) {
      await stripe.subscriptions.cancel(id);
      console.log("[CANCEL-MONTHLY-DONATION] cancelled", id);
    }
    return json({ cancelled: live.size });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CANCEL-MONTHLY-DONATION]", msg);
    return json({ error: msg }, 500);
  }
});
