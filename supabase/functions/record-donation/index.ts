import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { notifyDonationFriends } from "../_shared/friendDonationNotifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Amounts are decided here, never by the client.
const IAP_AMOUNTS: Record<string, number> = {
  donation_5: 500, donation_10: 1000, donation_25: 2500, donation_50: 5000,
};

const TRANSACTION_ID = /^[A-Za-z0-9._:-]{1,200}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Verification = "verified" | "sandbox" | "not_found" | "unavailable";

// RevenueCat's app_user_id is the Supabase user id (Purchases.logIn in inAppPurchases.ts).
async function verifyWithRevenueCat(appUserId: string, productId: string, transactionId: string): Promise<Verification> {
  const key = Deno.env.get("REVENUECAT_SECRET_API_KEY");
  if (!key) return "unavailable";
  try {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return "not_found";
    if (!res.ok) {
      console.error("RevenueCat lookup failed", res.status);
      return "unavailable";
    }
    const data = await res.json();
    const purchases = data?.subscriber?.non_subscriptions?.[productId];
    // deno-lint-ignore no-explicit-any
    const match = Array.isArray(purchases) && purchases.find((p: any) => p?.store_transaction_id === transactionId || p?.id === transactionId);
    if (!match) return "not_found";
    return match.is_sandbox ? "sandbox" : "verified";
  } catch (e) {
    console.error("RevenueCat unreachable", e);
    return "unavailable";
  }
}

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
    const productId = typeof body.productId === "string" ? body.productId : null;
    const transactionId = typeof body.transactionId === "string" && TRANSACTION_ID.test(body.transactionId) ? body.transactionId : null;
    if (!productId || !IAP_AMOUNTS[productId] || !transactionId) return json({ error: "Missing donation reference" }, 400);
    if (typeof body.appUserId === "string" && body.appUserId !== user.id) {
      return json({ error: "Purchase is not linked to this account" }, 400);
    }

    const amount = IAP_AMOUNTS[productId];
    const donationType = "one-time";

    const { data: existing } = await admin.from("donations")
      .select("id, user_id, amount, status").eq("store_transaction_id", transactionId).maybeSingle();
    if (existing && (existing.user_id !== user.id || existing.amount !== amount)) {
      return json({ error: "Purchase could not be verified" }, 400);
    }
    if (existing && existing.status !== "pending_verification") {
      return json({ success: true, alreadyRecorded: true, status: existing.status, amount, donationType });
    }

    const verification = await verifyWithRevenueCat(user.id, productId, transactionId);
    if (verification === "not_found") return json({ error: "Purchase could not be verified" }, 400);
    // Sandbox (TestFlight / review) purchases are free, so they never count toward tiers or the leaderboard.
    const status = verification === "verified" ? "confirmed" : verification === "sandbox" ? "sandbox" : "pending_verification";

    let donationId: string;
    if (existing) {
      if (status === "pending_verification") return json({ success: true, alreadyRecorded: true, status, amount, donationType });
      const { data: upgraded } = await admin.from("donations").update({ status })
        .eq("id", existing.id).eq("status", "pending_verification").select("id").maybeSingle();
      if (!upgraded) return json({ success: true, alreadyRecorded: true, status, amount, donationType });
      donationId = existing.id;
    } else {
      const { data: inserted, error: insertErr } = await admin.from("donations").insert({
        user_id: user.id, amount, currency: "usd", donation_type: donationType, status, store_transaction_id: transactionId,
      }).select("id").single();
      if (insertErr) {
        if (insertErr.code === "23505") return json({ success: true, alreadyRecorded: true, status, amount, donationType });
        throw insertErr;
      }
      donationId = inserted.id;
    }

    // Unverified donations are kept (the payment is real) but not thanked or counted until confirmed.
    if (status !== "confirmed") return json({ success: true, status, amount, donationType });

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

    // A failed friend push must never fail the donation
    try {
      await notifyDonationFriends(admin, donationId, { appId, apiKey });
    } catch (e) {
      console.error("friend donation notification failed", e);
    }

    return json({ success: true, status, amount, donationType });
  } catch (error) {
    console.error("record-donation error", error);
    return json({ error: error instanceof Error ? error.message : "Error" }, 500);
  }
});
