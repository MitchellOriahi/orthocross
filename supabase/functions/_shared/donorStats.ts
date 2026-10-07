import { DONOR_TEXT, getNextTier, getTier } from "./donorTiers.ts";

export const APP_URL = "https://orthocross.lovable.app";

// deno-lint-ignore no-explicit-any
type Admin = any;

export async function lifetimeTotal(admin: Admin, userId: string, excludeId?: string): Promise<number> {
  const { data } = await admin
    .from("donations")
    .select("id, amount, refunded_amount")
    .eq("user_id", userId)
    .eq("status", "confirmed");
  return (data ?? [])
    .filter((d: { id: string }) => d.id !== excludeId)
    .reduce((s: number, d: { amount: number; refunded_amount: number }) => s + Math.max(0, d.amount - (d.refunded_amount ?? 0)), 0);
}

export async function sendThankYouOnce(admin: Admin, donationId: string) {
  // Atomic claim: only one caller ever sends the email for a donation
  const { data: claimed } = await admin
    .from("donations")
    .update({ thank_you_sent_at: new Date().toISOString() })
    .eq("id", donationId)
    .is("thank_you_sent_at", null)
    .select("id, user_id, amount")
    .maybeSingle();
  if (!claimed) return;

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;
  const { data: u } = await admin.auth.admin.getUserById(claimed.user_id);
  const email = u?.user?.email;
  if (!email) return;
  const { data: p } = await admin.from("profiles").select("display_name, username").eq("id", claimed.user_id).maybeSingle();
  const name = p?.display_name || p?.username || "friend";
  const total = await lifetimeTotal(admin, claimed.user_id);
  const tier = getTier(total);
  const next = getNextTier(total);
  const iconUrl = tier ? `${APP_URL}/__l5e/assets-v1/${TIER_ICON_IDS[tier.key]}/tier-${tier.key}.jpg` : "";
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

  const html = `<div style="background:#111;color:#eee;font-family:Georgia,serif;padding:32px;text-align:center">
  <div style="max-width:480px;margin:0 auto">
  ${iconUrl ? `<img src="${iconUrl}" width="120" height="120" alt="${tier!.name}" style="border-radius:50%;border:1px solid #c9a24a"/>` : ""}
  <h1 style="color:#c9a24a;font-weight:normal">${esc(DONOR_TEXT.thankYouTitle(name))}</h1>
  <p style="font-size:16px;line-height:1.6">Thank you for your gift of <b>$${(claimed.amount / 100).toFixed(2)}</b>.</p>
  <p style="font-size:16px;line-height:1.6">${DONOR_TEXT.thankYouBody}</p>
  ${tier ? `<p style="color:#c9a24a;font-size:18px">${DONOR_TEXT.youAreNow(tier)}</p>` : ""}
  ${next ? `<p style="color:#aaa">${DONOR_TEXT.toNext(next.remainingCents, next.tier)}</p>` : ""}
  <p style="margin-top:28px"><a href="${APP_URL}" style="background:#c9a24a;color:#111;padding:12px 24px;border-radius:8px;text-decoration:none">Return to OrthoCross</a></p>
  <p style="color:#777;font-size:12px;margin-top:24px">"It is more blessed to give than to receive." — Acts 20:35</p>
  </div></div>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM") || "OrthoCross <onboarding@resend.dev>",
      to: [email],
      subject: "Thank you for supporting OrthoCross ☦",
      html,
    }),
  }).catch((e) => console.error("thank-you email failed", e));
}

export const TIER_ICON_IDS: Record<string, string> = {
  angel: "76947e96-8b8b-4539-bae4-6c7b6e51a4a7",
  archangel: "d4a692d6-aa1e-48d9-a067-840a3892a836",
  cherub: "8be593b4-f6b6-47fd-9d7d-636abd71509e",
  dominion: "b8dce3bc-1d6c-43e0-8988-86a6e5e0ef05",
  power: "ba38012e-158b-41c6-8d19-d6a0a62aadb2",
  principality: "484e586b-83fc-4076-89e4-c3e7e5a3e952",
  seraph: "c5c37dbe-5078-4b63-80c1-ae581093cac2",
  throne: "de9d8b5d-18bc-4bb1-9d15-ebb986b8f4d7",
  virtue: "a2e6adff-c65a-4d60-a5eb-5e32c6c81850",
};
