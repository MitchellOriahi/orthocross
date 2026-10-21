export * from "../../supabase/functions/_shared/donorTiers.ts";
import giftCross from "@/assets/tiers/cross.jpg.asset.json";

/** Orthodox cross shown in the gift circle before any tier is reached. */
export const GIFT_CROSS_ICON = giftCross.url;
import angel from "@/assets/tiers/angel.jpg.asset.json";
import archangel from "@/assets/tiers/archangel.jpg.asset.json";
import principality from "@/assets/tiers/principality.jpg.asset.json";
import power from "@/assets/tiers/power.jpg.asset.json";
import virtue from "@/assets/tiers/virtue.jpg.asset.json";
import dominion from "@/assets/tiers/dominion.jpg.asset.json";
import throne from "@/assets/tiers/throne.jpg.asset.json";
import cherub from "@/assets/tiers/cherub.jpg.asset.json";
import seraph from "@/assets/tiers/seraph.jpg.asset.json";

import giftCrossLight from "@/assets/tiers/cross-light.jpg.asset.json";
import angelLight from "@/assets/tiers/angel-light.jpg.asset.json";
import archangelLight from "@/assets/tiers/archangel-light.jpg.asset.json";
import principalityLight from "@/assets/tiers/principality-light.jpg.asset.json";
import powerLight from "@/assets/tiers/power-light.jpg.asset.json";
import virtueLight from "@/assets/tiers/virtue-light.jpg.asset.json";
import dominionLight from "@/assets/tiers/dominion-light.jpg.asset.json";
import throneLight from "@/assets/tiers/throne-light.jpg.asset.json";
import cherubLight from "@/assets/tiers/cherub-light.jpg.asset.json";
import seraphLight from "@/assets/tiers/seraph-light.jpg.asset.json";

/** Orthodox cross shown in the gift circle before any tier is reached. */
export const GIFT_CROSS_ICON = giftCross.url;
/** Light-mode Orthodox cross for the gift circle. */
export const GIFT_CROSS_ICON_LIGHT = giftCrossLight.url;

export const TIER_ICONS: Record<string, string> = {
  angel: angel.url, archangel: archangel.url, principality: principality.url, power: power.url,
  virtue: virtue.url, dominion: dominion.url, throne: throne.url, cherub: cherub.url, seraph: seraph.url,
};

/** Light-mode variants: bronze line art on parchment instead of gold on near-black. */
export const TIER_ICONS_LIGHT: Record<string, string> = {
  angel: angelLight.url, archangel: archangelLight.url, principality: principalityLight.url, power: powerLight.url,
  virtue: virtueLight.url, dominion: dominionLight.url, throne: throneLight.url, cherub: cherubLight.url, seraph: seraphLight.url,
};
