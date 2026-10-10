import { describe, expect, test } from "bun:test";
import { GIFT_SLIDER_AMOUNTS, getGiftPreview } from "./donationGift";
import { DONOR_TIERS } from "../../supabase/functions/_shared/donorTiers";

describe("gift selection", () => {
  test("slider offers $1, $2 and $5", () => {
    expect([...GIFT_SLIDER_AMOUNTS]).toEqual([1, 2, 5]);
  });
  test("slider gifts remain Angel with increasing glow", () => {
    expect(GIFT_SLIDER_AMOUNTS.map(amount => getGiftPreview(amount, false).tier?.key)).toEqual(["angel", "angel", "angel"]);
    expect(GIFT_SLIDER_AMOUNTS.map(amount => getGiftPreview(amount, false).glowLevel)).toEqual([0, 1, 2]);
  });
  test("tier minimums select their portrait and maximum slider position", () => {
    for (const tier of DONOR_TIERS) {
      expect(getGiftPreview(tier.minCents / 100, true).tier?.key).toBe(tier.key);
      expect(getGiftPreview(tier.minCents / 100, true).sliderIndex).toBe(2);
    }
  });
});