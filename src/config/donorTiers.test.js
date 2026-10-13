import { describe, expect, test } from "bun:test";
import { getTier, getNextTier, capitalizeName } from "../../supabase/functions/_shared/donorTiers.ts";

describe("donor tiers", () => {
  test("$1 is Angel", () => expect(getTier(100)?.name).toBe("Angel"));
  test("$0.99 has no tier", () => expect(getTier(99)).toBeNull());
  test("$10 is Archangel", () => expect(getTier(1000)?.name).toBe("Archangel"));
  test("$999 is Cherub", () => expect(getTier(99900)?.name).toBe("Cherub"));
  test("$1,000 is Seraph", () => expect(getTier(100000)?.name).toBe("Seraph"));
  test("$1 needs $9 more for Archangel", () => {
    const n = getNextTier(100);
    expect(n?.tier.name).toBe("Archangel");
    expect(n?.remainingCents).toBe(900);
  });
  test("Seraph has no next tier", () => expect(getNextTier(100000)).toBeNull());
});

describe("donor name", () => {
  test("lowercase name gets a capital first letter", () => expect(capitalizeName("john")).toBe("John"));
  test("the rest of the name is left exactly as typed", () => expect(capitalizeName("mary Jane")).toBe("Mary Jane"));
  test("an already capital name is unchanged", () => expect(capitalizeName("Anonymous Donor")).toBe("Anonymous Donor"));
  test("a missing name stays empty", () => expect(capitalizeName("")).toBe(""));
});
