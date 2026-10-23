import { DONOR_TEXT, getTier } from "./donorTiers.ts";

export const APP_URL = (Deno.env.get("APP_URL") || "https://app.orthocrossapp.com").replace(/\/+$/, "");

// Tier icons are served from public/email/; the img is omitted if the file is not deployed.
async function emailAssetUrl(file: string): Promise<string> {
  const url = `${APP_URL}/email/${file}`;
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
    return res.ok && (res.headers.get("Content-Type") ?? "").startsWith("image/") ? url : "";
  } catch {
    return "";
  }
}

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
  const iconUrl = tier ? await emailAssetUrl(`tier-${tier.key}.jpg`) : "";
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

  const html = `<div style="background:#111;color:#eee;font-family:Georgia,serif;padding:32px;text-align:center">
  <div style="max-width:480px;margin:0 auto">
  ${iconUrl ? `<img src="${iconUrl}" width="120" height="120" alt="${tier!.name}" style="border-radius:50%;border:1px solid #c9a24a"/>` : ""}
  <h1 style="color:#c9a24a;font-weight:normal">${esc(DONOR_TEXT.thankYouTitle(name))}</h1>
  <p style="font-size:16px;line-height:1.6">Thank you for your gift of <b>$${(claimed.amount / 100).toFixed(2)}</b>.</p>
  <p style="font-size:16px;line-height:1.6">${DONOR_TEXT.thankYouBody}</p>
  <p style="font-size:16px;line-height:1.6">${DONOR_TEXT.thankYouBlessing}</p>
  ${tier ? `<p style="color:#c9a24a;font-size:18px">${DONOR_TEXT.youAreNow(tier)}</p>` : ""}
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
