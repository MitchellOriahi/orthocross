import { getTier } from "../../supabase/functions/_shared/donorTiers";

export const GIFT_SLIDER_AMOUNTS = [1, 2, 5] as const;

/** Web slider stops: one per tier minimum, with Angel split into its three donatable amounts. */
export const TIER_SLIDER_STEPS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 750, 1000] as const;

export function nearestTierStepIndex(amount: number): number {
  let best = 0;
  for (let i = 0; i < TIER_SLIDER_STEPS.length; i++) {
    if (Math.abs(TIER_SLIDER_STEPS[i] - amount) < Math.abs(TIER_SLIDER_STEPS[best] - amount)) best = i;
  }
  return best;
}

export function getGiftPreview(amount: number, custom: boolean) {
  const sliderIndex = custom
    ? GIFT_SLIDER_AMOUNTS.length - 1
    : Math.max(0, GIFT_SLIDER_AMOUNTS.findIndex(value => value >= amount));
  return { sliderIndex, glowLevel: sliderIndex, tier: getTier(Math.round(amount * 100)) };
}