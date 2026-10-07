export * from "../../supabase/functions/_shared/donorTiers.ts";
import angel from "@/assets/tiers/angel.jpg.asset.json";
import archangel from "@/assets/tiers/archangel.jpg.asset.json";
import principality from "@/assets/tiers/principality.jpg.asset.json";
import power from "@/assets/tiers/power.jpg.asset.json";
import virtue from "@/assets/tiers/virtue.jpg.asset.json";
import dominion from "@/assets/tiers/dominion.jpg.asset.json";
import throne from "@/assets/tiers/throne.jpg.asset.json";
import cherub from "@/assets/tiers/cherub.jpg.asset.json";
import seraph from "@/assets/tiers/seraph.jpg.asset.json";

export const TIER_ICONS: Record<string, string> = {
  angel: angel.url, archangel: archangel.url, principality: principality.url, power: power.url,
  virtue: virtue.url, dominion: dominion.url, throne: throne.url, cherub: cherub.url, seraph: seraph.url,
};
