import { getTier, DONOR_TIERS, type DonorTier } from "../../supabase/functions/_shared/donorTiers";
import { FEATURED_MONTHLY_AMOUNT, FEATURED_YEARLY_AMOUNT, MIN_YEARLY_CENTS } from "../../supabase/functions/_shared/supportOffer";
export { annualComparison } from "../../supabase/functions/_shared/supportOffer";

export const GIFT_SLIDER_AMOUNTS = [1, FEATURED_MONTHLY_AMOUNT, 5] as const;

/** Amount the donation slider rests on when the dialog opens with no other choice made. */
export const DEFAULT_GIFT_AMOUNT = FEATURED_MONTHLY_AMOUNT;

export function getGiftPreview(amount: number, custom: boolean, steps: readonly number[] = GIFT_SLIDER_AMOUNTS) {
  const sliderIndex = custom
    ? steps.length - 1
    : Math.max(0, steps.findIndex(value => value >= amount));
  return { sliderIndex, glowLevel: Math.min(sliderIndex, 2), tier: getTier(Math.round(amount * 100)) };
}

/**
 * Angel shown in the gift circle: the tier row the donor just tapped wins
 * immediately, otherwise the tier this gift alone qualifies for.
 */
export function shownTier(pickedKey: string | null, amountTier: DonorTier | null): DonorTier | null {
  const picked = pickedKey ? DONOR_TIERS.find((t) => t.key === pickedKey) ?? null : null;
  return picked ?? amountTier;
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

/** Modest annual support with the middle gift featured, not a paid content tier. */
export const YEARLY_SLIDER_AMOUNTS = [8, 12, 16] as const;
export const DEFAULT_YEARLY_AMOUNT = FEATURED_YEARLY_AMOUNT;

export const minimumGift = (mode: GiftMode) => (mode === "year" ? MIN_YEARLY_CENTS / 100 : 1);

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
