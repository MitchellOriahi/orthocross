import { describe, expect, test } from "bun:test";
import { donationPeekHeight } from "./donationPeek";

describe("donation opening peek", () => {
  test("places the opening edge at half of the price slider", () => {
    expect(donationPeekHeight(100, 600, 16, 0, 763)).toBe(508);
  });
  test("scrolling to tiers cannot shrink the donation window", () => {
    const opening = donationPeekHeight(100, 600, 16, 0, 763);
    expect(donationPeekHeight(100, 200, 16, 400, 763)).toBe(opening);
    expect(donationPeekHeight(100, -200, 16, 800, 763)).toBe(opening);
  });
  test("moving the centered dialog after a tier selection does not change its height", () => {
    expect(donationPeekHeight(150, 650, 16, 0, 763)).toBe(508);
  });
  test("leaves screen clearance when translated content is taller than the viewport", () => {
    expect(donationPeekHeight(0, 1000, 16, 0, 763)).toBe(731);
  });
});