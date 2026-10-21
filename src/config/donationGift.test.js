import { describe, expect, test } from "bun:test";
import { shownTier } from "./donationGift";
import { getTier } from "../../supabase/functions/_shared/donorTiers";

describe("gift circle angel", () => {
  test("the tier row just tapped is shown at once", () => {
    // $1 alone only qualifies as Angel, yet tapping Seraph must show Seraph.
    const t = shownTier("seraph", getTier(100));
    expect(t?.key).toBe("seraph");
    expect(t?.name).toBe("Seraph");
  });

  test("with nothing tapped, the angel this gift qualifies for is shown", () => {
    const t = shownTier(null, getTier(1000));
    expect(t?.key).toBe("archangel");
  });

  test("tapping each tier shows that tier's own angel", () => {
    for (const key of ["angel", "archangel", "principality", "power", "virtue", "dominion", "throne", "cherub", "seraph"]) {
      expect(shownTier(key, getTier(100))?.key).toBe(key);
    }
  });

  test("an unknown tapped key falls back to the amount's angel", () => {
    expect(shownTier("no-such-tier", getTier(2500))?.key).toBe("principality");
  });

  test("nothing chosen and nothing qualified shows the cross", () => {
    expect(shownTier(null, null)).toBeNull();
  });
});
