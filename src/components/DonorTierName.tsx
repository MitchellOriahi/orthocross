import type { DonorTier } from "@/config/donorTiers";
import { useLanguage } from "@/contexts/LanguageContext";

/** Context-qualified keys prevent angelic ranks being translated as everyday objects. */
export function DonorTierName({ tier }: { tier: DonorTier }) {
  const { tr } = useLanguage();
  const key = `Angelic rank: ${tier.name}`;
  const translated = tr(key);
  return <span data-no-translate>{translated === key ? tier.name : translated}</span>;
}

export function DonorTierAnnouncement({ tier, previous }: { tier: DonorTier; previous?: DonorTier | null }) {
  const { language, tr } = useLanguage();
  if (language === "en") {
    if (previous === undefined) return <>You are now {tier.article} <DonorTierName tier={tier} />.</>;
    return previous
      ? <>You've risen from <DonorTierName tier={previous} /> to <DonorTierName tier={tier} />!</>
      : <>You've joined the ranks as {tier.article} <DonorTierName tier={tier} />!</>;
  }
  return <>{previous === undefined ? tr("Your donation tier") : tr("New donation tier")}: {previous && <><DonorTierName tier={previous} /> → </>}<DonorTierName tier={tier} /></>;
}