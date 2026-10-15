import { expect, test } from "bun:test";
import { resolveProfileDonorTier } from "./donorProfileTier";
import { DONOR_TIERS } from "../../supabase/functions/_shared/donorTiers";

test("non-donators never receive a profile tier, even with a stale tier key", () => {
  expect(resolveProfileDonorTier({ hasDonated: false, tierKey: "archangel" })).toBeNull();
});
test("confirmed donors retain their exact current tier", () => {
  for (const tier of DONOR_TIERS) {
    expect(resolveProfileDonorTier({ hasDonated: true, tierKey: tier.key })).toBe(tier.key);
  }
});
test("missing or unknown tiers remain blank", () => {
  expect(resolveProfileDonorTier(null)).toBeNull();
  expect(resolveProfileDonorTier({ hasDonated: true, tierKey: "unknown" })).toBeNull();
});
