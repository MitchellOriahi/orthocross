import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function recordDonation(
  userId: string | undefined,
  amount: number | null,
  currency: string | null,
  paymentRef: string | null
) {
  if (!userId || userId === "anonymous" || !amount || amount <= 0) return;

  if (paymentRef) {
    const { data: existing } = await supabase
      .from("donations")
      .select("id")
      .eq("stripe_payment_intent_id", paymentRef)
      .maybeSingle();
    if (existing) return;
  }

  const { error } = await supabase.from("donations").insert({
    user_id: userId,
    amount,
    currency: currency || "usd",
    stripe_payment_intent_id: paymentRef,
  });
  if (error) console.error("Failed to record donation:", error);
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await recordDonation(
          session.metadata?.user_id,
          session.amount_total,
          session.currency,
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.id
        );
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        // The first invoice is already recorded via checkout.session.completed
        if (invoice.billing_reason !== "subscription_cycle") break;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (!subscriptionId) break;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await recordDonation(
          subscription.metadata?.user_id,
          invoice.amount_paid,
          invoice.currency,
          typeof invoice.payment_intent === "string"
            ? invoice.payment_intent
            : invoice.id
        );
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
