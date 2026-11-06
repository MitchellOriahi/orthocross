import { describe, expect, test } from "bun:test";
import { DONOR_REWARDS } from "./donorRewards";
import { DONOR_TIERS, getTier, getNextTier } from "../../supabase/functions/_shared/donorTiers";

describe("supplied lifetime reward milestones", () => {
  test("$1 offers digital thanks and recognition", () => {
    expect(DONOR_TIERS[0].minCents).toBe(100);
    expect(DONOR_REWARDS.angel.map(r => r.kind)).toEqual(["thanks", "recognition"]);
    expect(DONOR_REWARDS.angel[0].delivery).toBe("digital");
  });
  for (const [key, dollars, framing] of [["archangel", 10, "head"], ["principality", 25, "bust"], ["power", 50, "full-body"]]) {
    test(`$${dollars} offers a signed digital ${framing} sketch`, () => {
      expect(DONOR_TIERS.find(t => t.key === key)?.minCents).toBe(dollars * 100);
      expect(DONOR_REWARDS[key].find(r => r.kind === "drawing")).toMatchObject({ delivery: "digital", framing, colored: false });
    });
  }
  test("$100 offers a digital colored head and one call", () => {
    expect(getTier(10000)?.key).toBe("virtue");
    expect(DONOR_REWARDS.virtue.find(r => r.kind === "drawing")).toMatchObject({ delivery: "digital", framing: "head", colored: true });
    expect(DONOR_REWARDS.virtue.find(r => r.kind === "call")?.frequency).toBe("once");
    expect(DONOR_REWARDS.virtue.find(r => r.kind === "bracelet")?.colorChoice).toBe(true);
  });
  test("$250 offers physical colored head, weekly calls and flag/poster", () => {
    expect(getTier(25000)?.key).toBe("dominion");
    expect(DONOR_REWARDS.dominion.find(r => r.kind === "drawing")).toMatchObject({ delivery: "physical", framing: "head", colored: true });
    expect(DONOR_REWARDS.dominion.find(r => r.kind === "call")?.frequency).toBe("weekly");
    expect(DONOR_REWARDS.dominion.some(r => r.kind === "flag")).toBe(true);
  });
  for (const [key, dollars, framing, knots, frequency] of [["throne", 500, "bust", 33, "weekly"], ["cherub", 750, "full-body", 50, "once"], ["seraph", 1000, "full-body", 100, "once"]]) {
    test(`$${dollars} offers its specified physical drawing, calls and ${knots}-knot rope`, () => {
      expect(getTier(dollars * 100)?.key).toBe(key);
      expect(DONOR_REWARDS[key].find(r => r.kind === "drawing")).toMatchObject({ delivery: "physical", framing, colored: true });
      expect(DONOR_REWARDS[key].find(r => r.kind === "call")?.frequency).toBe(frequency);
      expect(DONOR_REWARDS[key].find(r => r.kind === "rope")?.knots).toBe(knots);
      expect(DONOR_REWARDS[key].some(r => r.kind === "icon")).toBe(true);
    });
  }
  test("monthly donations accumulate rather than resetting: five $2 payments reach $10", () => {
    const payments = [200, 200, 200, 200, 200];
    expect(getNextTier(payments.slice(0, 4).reduce((a, b) => a + b, 0))?.remainingCents).toBe(200);
    expect(getTier(payments.reduce((a, b) => a + b, 0))?.key).toBe("archangel");
  });
});