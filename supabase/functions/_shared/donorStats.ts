import { DONOR_TEXT, getTier } from "./donorTiers.ts";

export const APP_URL = "https://orthocross.lovable.app";

// Personal thank-yous from the app's creator, included in every donation thank-you email.
// A donor's first gift shows the first note; each further gift shows the next one, cycling around.
export interface CreatorNote {
  title: string;
  paragraphs: string[];
}

export const CREATOR_NOTES: CreatorNote[] = [
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "I want to thank you personally. I built OrthoCross on my own, and keeping it running costs real money every month. Your gift is not just a number to me. It helps carry this work forward and lets me keep the app free for everyone who is seeking Christ.",
      "Thank you for believing in this, and in me. I will keep you in my prayers.",
    ],
  },
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "Thank you again for standing with me. OrthoCross has no investors and no ads — it is one person's labor of love, carried entirely by readers like you. Gifts like yours are what keep the lights on and every prayer and saint story free for all.",
      "You have my deepest gratitude, and a place in my prayers. God bless.",
    ],
  },
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "Your continued generosity humbles me. Every month this app costs real money to keep alive, and it is friends like you who make that possible. Because of your kindness, someone searching for the ancient faith will find it here — free, and open to all.",
      "From my heart to yours: thank you, and God bless.",
    ],
  },
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "I am deeply grateful that you have chosen to give again. What your generosity sustains is more than an app — it is a small chapel where anyone can pray, read, and grow. Your gift keeps its doors open and its lamps lit.",
      "May Christ reward your kindness. You remain in my prayers. God bless.",
    ],
  },
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "Once more, thank you. When I began building OrthoCross, I prayed that God would send people who believed in this work as much as I do. Your continued giving is an answer to that prayer.",
      "Every prayer, every saint's story, every verse stays free because of friends like you. May the Lord bless you and keep you. God bless.",
    ],
  },
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "Your gift arrived like a lamp lit in a dark room. There are nights when the work is long and the costs weigh heavy, and then a gift like yours comes — and I remember why I started.",
      "Thank you for carrying this with me. You and your loved ones are in my prayers. God bless.",
    ],
  },
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "Thank you for giving again. I think often of the widow's two mites — it is not the size of the gift but the heart behind it that the Lord sees. Your heart is generous, and I am honored by it.",
      "May God multiply your kindness back to you a hundredfold. You remain in my prayers. God bless.",
    ],
  },
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "Another gift from you — thank you, truly. Somewhere tonight, a stranger is opening this app for the first time, searching for something they cannot name. Your generosity is part of why they will find it.",
      "That is no small thing. Thank you for making it possible. God bless.",
    ],
  },
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "I want you to know that your faithfulness does not go unnoticed. Month after month, gift after gift, you have stood beside this work. I built OrthoCross alone, but because of you, I do not carry it alone.",
      "May the peace of Christ rest on you and your household. God bless.",
    ],
  },
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "Thank you for your continued kindness. Through fasts and feasts, through ordinary days and holy ones, your giving has kept this little chapel in the cloud open to all who knock.",
      "I ask God to reward you in the ways only He can. You are remembered in my prayers. God bless.",
    ],
  },
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "Your generosity humbles me anew. Every server bill paid, every new translation added, every improvement made — gifts like yours are what turn those hopes into reality.",
      "Thank you for believing in this mission. May the Lord bless you abundantly. God bless.",
    ],
  },
  {
    title: "A personal note from the creator of OrthoCross",
    paragraphs: [
      "A full year of your kindness. Twelve months of gifts, each one a quiet act of faith in this work. I do not have words big enough, so I will simply say: thank you, from the bottom of my heart.",
      "You have helped carry OrthoCross through an entire year of ministry. May Christ Himself be your reward. You are always in my prayers. God bless.",
    ],
  },
];

/** Which note the Nth gift shows: each donation moves to the next note, cycling around. */
export const pickCreatorNoteIndex = (ordinal: number): number =>
  ((Math.max(0, ordinal) % CREATOR_NOTES.length) + CREATOR_NOTES.length) % CREATOR_NOTES.length;

/** Renders one creator note as HTML for a dark (webhook) or light (checkout) thank-you email. */
export function renderCreatorNote(ordinal: number, theme: "dark" | "light" = "dark"): string {
  const note = CREATOR_NOTES[pickCreatorNoteIndex(ordinal)];
  const titleStyle = theme === "light" ? "color:#8b4513;font-weight:bold" : "color:#c9a24a";
  const borderColor = theme === "light" ? "#e5d9cc" : "#c9a24a55";
  return `<div style="text-align:left;border-top:1px solid ${borderColor};margin-top:28px;padding-top:20px">
  <p style="${titleStyle};font-size:15px;margin:0 0 10px">${note.title}</p>
  ${note.paragraphs.map((p) => `<p style="font-size:15px;line-height:1.7">${p}</p>`).join("\n  ")}
  <p style="font-size:15px;line-height:1.7">With heartfelt gratitude in Christ,<br/>The creator of OrthoCross</p>
</div>`;
}

/** Zero-based ordinal of this donor's gift: 0 for a first gift, 1 for a second, and so on. */
export async function donationOrdinal(client: Admin, userId: string): Promise<number> {
  const { count, error } = await client
    .from("donations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error || !count) return 0;
  return Math.max(0, count - 1);
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
  // The gift being thanked is already in the table, so its ordinal counts prior gifts
  const ordinal = await donationOrdinal(admin, claimed.user_id);
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;
  const { data: u } = await admin.auth.admin.getUserById(claimed.user_id);
  const email = u?.user?.email;
  if (!email) return;
  const { data: p } = await admin.from("profiles").select("display_name, username").eq("id", claimed.user_id).maybeSingle();
  const name = p?.display_name || p?.username || "friend";
  const total = await lifetimeTotal(admin, claimed.user_id);
  const tier = getTier(total);
  const iconUrl = tier ? `${APP_URL}/__l5e/assets-v1/${TIER_ICON_IDS[tier.key]}/tier-${tier.key}.jpg` : "";
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

  const html = `<div style="background:#111;color:#eee;font-family:Georgia,serif;padding:32px;text-align:center">
  <div style="max-width:480px;margin:0 auto">
  ${iconUrl ? `<img src="${iconUrl}" width="120" height="120" alt="${tier!.name}" style="border-radius:50%;border:1px solid #c9a24a"/>` : ""}
  <h1 style="color:#c9a24a;font-weight:normal">${esc(DONOR_TEXT.thankYouTitle(name))}</h1>
  <p style="font-size:16px;line-height:1.6">Thank you for your gift of <b>$${(claimed.amount / 100).toFixed(2)}</b>.</p>
  <p style="font-size:16px;line-height:1.6">${DONOR_TEXT.thankYouBody}</p>
  <p style="font-size:16px;line-height:1.6">${DONOR_TEXT.thankYouBlessing}</p>
  ${tier ? `<p style="color:#c9a24a;font-size:18px">${DONOR_TEXT.youAreNow(tier)}</p>` : ""}
  ${renderCreatorNote(pickCreatorNoteIndex(ordinal), "dark")}
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
