import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sendThankYouOnce } from "../_shared/donorStats.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const UUID = /^[0-9a-f-]{36}$/i;

async function recordDonation(p: {
  userId: string; amount: number; ref: string; type: string; sessionId?: string | null;
}) {
  if (!UUID.test(p.userId) || p.amount <= 0) return;
  const { data: existing } = await admin.from("donations").select("id").eq("stripe_payment_intent_id", p.ref).maybeSingle();
  let id = existing?.id;
  if (!id) {
    const { data, error } = await admin.from("donations").insert({
      user_id: p.userId, amount: p.amount, currency: "usd", stripe_payment_intent_id: p.ref,
      donation_type: p.type, status: "confirmed", checkout_session_id: p.sessionId ?? null,
    }).select("id").single();
    if (error) {
      if (error.code === "23505") return; // already recorded by a parallel delivery
      throw error;
    }
    id = data.id;
  }
  await sendThankYouOnce(admin, id);
}

async function invoicePaymentIntent(invoiceId: string): Promise<string | null> {
  try {
    // deno-lint-ignore no-explicit-any
    const list: any = await (stripe as any).invoicePayments.list({ invoice: invoiceId, limit: 1 });
    return list?.data?.[0]?.payment?.payment_intent ?? null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secret, undefined, Stripe.createSubtleCryptoProvider());
  } catch (e) {
    console.error("bad signature", e);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.mode === "payment" && s.payment_status === "paid") {
        await recordDonation({
          userId: s.metadata?.user_id ?? "", amount: s.amount_total ?? 0,
          ref: (s.payment_intent as string) || s.id, type: "one-time", sessionId: s.id,
        });
      }
    } else if (event.type === "invoice.paid") {
      // deno-lint-ignore no-explicit-any
      const inv = event.data.object as any;
      let userId = inv.parent?.subscription_details?.metadata?.user_id
        ?? inv.lines?.data?.[0]?.metadata?.user_id ?? "";
      const subId = inv.parent?.subscription_details?.subscription ?? inv.subscription;
      if (!userId && subId) {
        const sub = await stripe.subscriptions.retrieve(typeof subId === "string" ? subId : subId.id);
        userId = sub.metadata?.user_id ?? "";
      }
      const pi = await invoicePaymentIntent(inv.id);
      await recordDonation({ userId, amount: inv.amount_paid ?? 0, ref: pi || inv.id, type: "monthly" });
    } else if (event.type === "charge.refunded") {
      const ch = event.data.object as Stripe.Charge;
      const pi = typeof ch.payment_intent === "string" ? ch.payment_intent : ch.payment_intent?.id;
      if (pi) {
        await admin.from("donations")
          .update({ refunded_amount: ch.amount_refunded, status: ch.refunded ? "refunded" : "confirmed" })
          .eq("stripe_payment_intent_id", pi);
      }
    }
  } catch (e) {
    console.error("webhook handling failed", e);
    return new Response("Handler error", { status: 500 });
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
