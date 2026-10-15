import { DONOR_TIERS } from "../../supabase/functions/_shared/donorTiers";

export function resolveProfileDonorTier(status: { hasDonated?: boolean; tierKey?: string | null } | null | undefined): string | null {
  if (!status?.hasDonated) return null;
  return DONOR_TIERS.find((tier) => tier.key === status.tierKey)?.key ?? null;
}
