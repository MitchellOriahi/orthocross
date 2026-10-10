import { getTier } from "../../supabase/functions/_shared/donorTiers";

export const GIFT_SLIDER_AMOUNTS = [1, 2, 5] as const;

export function getGiftPreview(amount: number, custom: boolean) {
  const sliderIndex = custom
    ? GIFT_SLIDER_AMOUNTS.length - 1
    : Math.max(0, GIFT_SLIDER_AMOUNTS.findIndex(value => value >= amount));
  return { sliderIndex, glowLevel: sliderIndex, tier: getTier(Math.round(amount * 100)) };
}