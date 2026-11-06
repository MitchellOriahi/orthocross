export interface DonorReward {
  kind: "thanks" | "recognition" | "drawing" | "call" | "gift" | "bracelet" | "flag" | "icon" | "rope";
  text: string;
  delivery?: "digital" | "mailed" | "physical";
  framing?: "head" | "bust" | "full-body";
  colored?: boolean;
  frequency?: "once" | "weekly";
  colorChoice?: boolean;
  knots?: number;
}

const recognition: DonorReward = { kind: "recognition", text: "Your username posted on the OrthoCross account with your tier forever" };
const digitalThanks: DonorReward = { kind: "thanks", delivery: "digital", text: "Unique human-made digital thank-you note" };
const mailedThanks: DonorReward = { kind: "thanks", delivery: "mailed", text: "Unique human-made mailed thank-you note" };
const gifts: DonorReward = { kind: "gift", text: "Small Jesus toy + sticker + icon card" };
const bracelet: DonorReward = { kind: "bracelet", text: "Handmade Orthodox Komboskini bracelet" };
const colorBracelet: DonorReward = { ...bracelet, colorChoice: true, text: "Handmade Orthodox Komboskini bracelet in your color choice" };
const icon: DonorReward = { kind: "icon", delivery: "physical", text: '6″ × 8″ custom engraved thermal-film hand-laminated icon shipped to you' };
const call: DonorReward = { kind: "call", frequency: "once", text: "1-on-1 walkthrough call explaining the content-making and app-making process" };
const weeklyCall: DonorReward = { ...call, frequency: "weekly", text: "Weekly 1-on-1 calls explaining the content-making and app-making process" };
const drawing = (framing: "head" | "bust" | "full-body", delivery: "digital" | "physical", colored: boolean, text: string): DonorReward => ({ kind: "drawing", framing, delivery, colored, text });
const rope = (knots: number): DonorReward => ({ kind: "rope", knots, delivery: "physical", text: `${knots}-knot handmade custom prayer rope made to your description and sent to you` });

// Explicit offers, not inherited benefits: call frequency and delivery differ by milestone.
export const DONOR_REWARDS: Readonly<Record<string, readonly DonorReward[]>> = {
  angel: [digitalThanks, recognition],
  archangel: [digitalThanks, recognition, drawing("head", "digital", false, "Signed digital headshot sketch")],
  principality: [digitalThanks, recognition, drawing("bust", "digital", false, "Signed digital bust sketch")],
  power: [digitalThanks, recognition, drawing("full-body", "digital", false, "Signed digital full-body sketch")],
  virtue: [mailedThanks, drawing("head", "digital", true, "Signed digital colored head drawing"), recognition, call, gifts, colorBracelet],
  dominion: [mailedThanks, drawing("head", "physical", true, "Signed physical colored head drawing"), recognition, weeklyCall, gifts, colorBracelet, { kind: "flag", text: "Unique Orthodox faith flag and poster" }],
  throne: [mailedThanks, drawing("bust", "physical", true, "Signed physical colored bust drawing"), recognition, weeklyCall, gifts, bracelet, icon, rope(33)],
  cherub: [mailedThanks, drawing("full-body", "physical", true, "Signed physical colored full-body drawing"), recognition, call, gifts, bracelet, icon, rope(50)],
  seraph: [mailedThanks, drawing("full-body", "physical", true, "Signed physical colored full-body drawing"), recognition, call, gifts, bracelet, icon, rope(100)],
};

export const DONATION_ACCUMULATION_COPY = "Every donation adds to your lifetime total, including each monthly renewal. Your progress never resets at the end of a month. Reach the totals below to unlock each tier’s rewards.";