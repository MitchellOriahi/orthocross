import { getTier } from "../../supabase/functions/_shared/donorTiers";

export const GIFT_SLIDER_AMOUNTS = [1, 2, 5] as const;

/** Amount the donation slider rests on when the dialog opens with no other choice made. */
export const DEFAULT_GIFT_AMOUNT = 2;

export function getGiftPreview(amount: number, custom: boolean) {
  const sliderIndex = custom
    ? GIFT_SLIDER_AMOUNTS.length - 1
    : Math.max(0, GIFT_SLIDER_AMOUNTS.findIndex(value => value >= amount));
  return { sliderIndex, glowLevel: sliderIndex, tier: getTier(Math.round(amount * 100)) };
}

/** The gift the dialog is left with after the monthly / one-time toggle is flipped: nothing chosen yet. */
export interface GiftAmount {
  amount: number;
  customAmount: string;
  useCustom: boolean;
}

export const EMPTY_GIFT: GiftAmount = { amount: 0, customAmount: "", useCustom: false };

export const giftAfterModeToggle = (): GiftAmount => ({ ...EMPTY_GIFT });
export type GiftMode = "month" | "year" | "once";

/** Yearly gifts start at $12 (about $1/month) and stay modest for everyday readers. */
export const YEARLY_SLIDER_AMOUNTS = [12, 18, 24] as const;
export const DEFAULT_YEARLY_AMOUNT = 18;

export const minimumGift = (mode: GiftMode) => (mode === "year" ? 12 : 1);

/** Plain-language picture of what a gift sustains. */
export function giftImpact(amount: number, mode: GiftMode): string {
  const monthly = mode === "year" ? amount / 12 : mode === "month" ? amount : 0;
  if (mode === "once") {
    if (amount >= 25) return "Helps fund new saint stories and prayers.";
    if (amount >= 5) return "Keeps the read-aloud voices speaking for many chapters.";
    return "Every gift helps keep OrthoCross free.";
  }
  if (monthly >= 5) return "Helps fund new saint stories, prayers and features.";
  if (monthly >= 2) return "Helps keep the app running smoothly for every reader.";
  return "Helps keep Scripture and prayers free and ad-free.";
}
