export const DONOR_TIER_INTRO_KEY = "donor-tiers-intro-seen";

export const shouldPulseArchangel = (seen: string | null) => seen !== "1";
export const completesDonorTierIntro = (tierKey: string) => tierKey === "archangel";