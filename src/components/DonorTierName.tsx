import type { DonorTier } from "@/config/donorTiers";
import { useLanguage } from "@/contexts/LanguageContext";

/** Context-qualified keys prevent angelic ranks being translated as everyday objects. */
export function DonorTierName({ tier }: { tier: DonorTier }) {
  const { tr } = useLanguage();
  const key = `Angelic rank: ${tier.name}`;
  const translated = tr(key);
  return <span data-no-translate>{translated === key ? tier.name : translated}</span>;
}