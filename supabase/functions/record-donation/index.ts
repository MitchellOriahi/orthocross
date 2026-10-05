import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IAP_AMOUNTS: Record<string, number> = {
  donation_5: 500, donation_10: 1000, donation_25: 2500, donation_50: 5000,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const { data: { user }, error: authErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const productId = typeof body.productId === "string" ? body.productId : null;
    const transactionId = typeof body.transactionId === "string" ? body.transactionId.slice(0, 200) : null;

    let amount = 0;
    let ref = "";
    let donationType = "one-time";

    if (sessionId) {
      if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return json({ error: "Invalid session" }, 400);
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.metadata?.user_id !== user.id) return json({ error: "Donation does not belong to user" }, 403);
      if (session.payment_status !== "paid" && session.status !== "complete") {
        return json({ error: "Donation not completed" }, 400);
      }
      amount = session.amount_total ?? 0;
      ref = session.id;
      donationType = session.mode === "subscription" ? "monthly" : "one-time";
    } else if (productId && IAP_AMOUNTS[productId]) {
      amount = IAP_AMOUNTS[productId];
      ref = `iap:${transactionId || `${user.id}:${Date.now()}`}`;
    } else {
      return json({ error: "Missing donation reference" }, 400);
    }

    if (amount <= 0) return json({ error: "Invalid amount" }, 400);

    // Idempotent insert — a donation is only recorded (and thanked) once
    const { data: existing } = await admin.from("donations").select("id").eq("stripe_payment_intent_id", ref).maybeSingle();
    if (existing) return json({ success: true, alreadyRecorded: true, amount, donationType });

    const { error: insertErr } = await admin.from("donations").insert({
      user_id: user.id, amount, currency: "usd", stripe_payment_intent_id: ref,
    });
    if (insertErr) {
      if (insertErr.code === "23505") return json({ success: true, alreadyRecorded: true, amount, donationType });
      throw insertErr;
    }

    // Thank-you email
    fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-donation-thank-you`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json", apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" },
      body: JSON.stringify({ donationType, amount }),
    }).catch((e) => console.error("thank-you email failed", e));

    // Thank-you message (push notification)
    const appId = Deno.env.get("ONESIGNAL_APP_ID");
    const apiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (appId && apiKey) {
      fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${apiKey}` },
        body: JSON.stringify({
          app_id: appId,
          include_external_user_ids: [user.id],
          headings: { en: "Thank You! ☦" },
          contents: { en: `Thank you for your generous $${(amount / 100).toFixed(2)} donation. May God bless you abundantly! 🙏` },
        }),
      }).catch((e) => console.error("thank-you push failed", e));
    }

    return json({ success: true, amount, donationType });
  } catch (error) {
    console.error("record-donation error", error);
    return json({ error: error instanceof Error ? error.message : "Error" }, 500);
  }
});
