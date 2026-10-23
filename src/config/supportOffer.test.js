import { expect, test } from "bun:test";
import { SUPPORT_PRICES, MIN_YEARLY_CENTS } from "../../supabase/functions/_shared/supportOffer";

test("all featured gifts have recurring Stripe prices", () => {
  for (const key of ["year:800", "year:1200", "year:1600", "month:300"]) {
    expect(SUPPORT_PRICES[key]).toMatch(/^price_/);
  }
  expect(MIN_YEARLY_CENTS).toBe(800);
});
test("custom gifts fall back without changing existing subscriptions", () => {
  expect(SUPPORT_PRICES["year:2000"]).toBeUndefined();
  expect(SUPPORT_PRICES["month:200"]).toBeUndefined();
});