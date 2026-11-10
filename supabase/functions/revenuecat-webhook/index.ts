import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sendThankYouOnce } from "../_shared/donorStats.ts";
import { notifyDonationFriends } from "../_shared/friendDonationNotifications.ts";
import { parseRevenueCatEvent } from "../_shared/iapDonations.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function sameSecret(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Records every App Store / Play Store payment RevenueCat reports, including subscription renewals,
// so recurring donors keep climbing the lifetime tiers while the app is closed.
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const secret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!secret) return json({ error: "Webhook not configured" }, 503);
  const auth = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!sameSecret(auth, secret)) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => null);
  const parsed = parseRevenueCatEvent(body?.event);
  if (!parsed) return json({ received: true, ignored: true });

  try {
    if (parsed.kind === "refund") {
      await admin.from("donations").update({ status: "refunded" }).eq("store_transaction_id", parsed.transactionId);
      return json({ received: true });
    }

    const { data: existing } = await admin.from("donations")
      .select("id, user_id, status").eq("store_transaction_id", parsed.transactionId).maybeSingle();

    let donationId: string | null = null;
    if (existing) {
      if (existing.user_id !== parsed.userId) return json({ received: true, ignored: true });
      if (existing.status !== "pending_verification") return json({ received: true, alreadyRecorded: true });
      const { data: upgraded } = await admin.from("donations").update({ status: parsed.status })
        .eq("id", existing.id).eq("status", "pending_verification").select("id").maybeSingle();
      donationId = upgraded?.id ?? null;
    } else {
      const { data: inserted, error } = await admin.from("donations").insert({
        user_id: parsed.userId, amount: parsed.amount, currency: "usd", donation_type: parsed.donationType,
        status: parsed.status, store_transaction_id: parsed.transactionId,
      }).select("id").single();
      if (error) {
        if (error.code === "23505") return json({ received: true, alreadyRecorded: true });
        throw error;
      }
      donationId = inserted.id;
    }

    // Sandbox (TestFlight / review) gifts are free, so they are never thanked or counted.
    if (donationId && parsed.status === "confirmed") {
      await sendThankYouOnce(admin, donationId);
      try {
        await notifyDonationFriends(admin, donationId, {
          appId: Deno.env.get("ONESIGNAL_APP_ID"), apiKey: Deno.env.get("ONESIGNAL_REST_API_KEY"),
        });
      } catch (e) {
        console.error("friend donation notification failed", e);
      }
    }
    return json({ received: true });
  } catch (e) {
    console.error("revenuecat webhook failed", e);
    return json({ error: "Handler error" }, 500);
  }
});
