// Confirms a just-completed Stripe Checkout session directly with Stripe, so the
// donation is recorded and thanked immediately (idempotent with stripe-webhook).
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendThankYouOnce } from "../_shared/donorStats.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function invoicePaymentIntent(invoiceId: string): Promise<string | null> {
  try {
    // deno-lint-ignore no-explicit-any
    const list: any = await (stripe as any).invoicePayments.list({ invoice: invoiceId, limit: 1 });
    return list?.data?.[0]?.payment?.payment_intent ?? null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const { data: { user } } = await admin.auth.getUser(auth.slice(7));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) return json({ error: "Invalid session" }, 400);

    const s = await stripe.checkout.sessions.retrieve(sessionId);
    if (s.metadata?.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (s.payment_status !== "paid") return json({ confirmed: false });

    let amount = s.amount_total ?? 0;
    let ref = (s.payment_intent as string) || s.id;
    let type = "one-time";
    if (s.mode === "subscription") {
      type = "monthly";
      const invId = typeof s.invoice === "string" ? s.invoice : s.invoice?.id;
      if (!invId) return json({ confirmed: false });
      const inv = await stripe.invoices.retrieve(invId);
      amount = inv.amount_paid ?? amount;
      ref = (await invoicePaymentIntent(invId)) || invId;
    }
    if (amount <= 0) return json({ confirmed: false });

    const { data: existing } = await admin.from("donations").select("id").eq("stripe_payment_intent_id", ref).maybeSingle();
    let id = existing?.id;
    if (!id) {
      const { data, error } = await admin.from("donations").insert({
        user_id: user.id, amount, currency: "usd", stripe_payment_intent_id: ref,
        donation_type: type, status: "confirmed", checkout_session_id: s.id,
      }).select("id").single();
      if (error && error.code !== "23505") throw error;
      id = data?.id;
    }
    if (id) await sendThankYouOnce(admin, id);
    return json({ confirmed: true });
  } catch (e) {
    console.error("confirm-donation error", e);
    return json({ error: "Could not confirm donation" }, 500);
  }
});
