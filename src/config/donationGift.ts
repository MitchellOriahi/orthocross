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