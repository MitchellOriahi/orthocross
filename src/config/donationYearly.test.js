import { describe, expect, test } from "bun:test";
import { YEARLY_SLIDER_AMOUNTS, DEFAULT_YEARLY_AMOUNT, DEFAULT_GIFT_AMOUNT, minimumGift, getGiftPreview, annualComparison } from "./donationGift";

describe("yearly gifts", () => {
  test("annual gifts are $8, $12 and $16 with an $8 minimum", () => {
    expect(minimumGift("year")).toBe(8);
    expect([...YEARLY_SLIDER_AMOUNTS]).toEqual([8, 12, 16]);
  });
  test("feature $12 yearly and $3 monthly", () => {
    expect(DEFAULT_YEARLY_AMOUNT).toBe(12);
    expect(DEFAULT_GIFT_AMOUNT).toBe(3);
  });
  test("annual comparison uses twelve actual monthly payments", () => {
    expect(annualComparison(12)).toEqual({ monthlyYear: 35.88, savings: 23.88 });
    expect(annualComparison(40).savings).toBe(0);
  });
  test("monthly and one-time minimum stays $1", () => {
    expect(minimumGift("month")).toBe(1);
    expect(minimumGift("once")).toBe(1);
  });
  test("glow brightens step by step across the yearly slider", () => {
    expect(YEARLY_SLIDER_AMOUNTS.map(amount => getGiftPreview(amount, false, YEARLY_SLIDER_AMOUNTS).glowLevel)).toEqual([0, 1, 2]);
  });
});
