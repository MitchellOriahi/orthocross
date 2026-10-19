import { describe, expect, test } from "bun:test";
import { YEARLY_SLIDER_AMOUNTS, minimumGift } from "./donationGift";

describe("yearly gifts", () => {
  test("start at $12", () => {
    expect(minimumGift("year")).toBe(12);
    expect(YEARLY_SLIDER_AMOUNTS[0]).toBe(12);
  });
  test("monthly and one-time minimum stays $1", () => {
    expect(minimumGift("month")).toBe(1);
    expect(minimumGift("once")).toBe(1);
  });
});
