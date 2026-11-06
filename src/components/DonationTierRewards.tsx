import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DonorTierName } from "./DonorTierName";
import { DONOR_TIERS } from "@/config/donorTiers";
import { DONATION_ACCUMULATION_COPY, DONOR_REWARDS } from "@/config/donorRewards";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDonationMoney } from "@/lib/donationCurrency";

interface Props {
  activeTierKey: string | null;
  pulse: boolean;
  canSelectAmount: boolean;
  onSelect: (key: string, amount: number) => void;
  onTierOpen: (key: string) => void;
}

export function DonationTierRewards({ activeTierKey, pulse, canSelectAmount, onSelect, onTierOpen }: Props) {
  const { language, tr } = useLanguage();
  const money = (amount: number) => formatDonationMoney(amount, language);
  return (
    <div className="px-3 pb-3">
      <p className="px-3 pb-3 text-xs leading-relaxed text-muted-foreground">{tr(DONATION_ACCUMULATION_COPY)}</p>
      <div className="divide-y divide-border">
        {DONOR_TIERS.map(t => (
          <Collapsible key={t.key} className={`donor-tier-${t.key}`} onOpenChange={open => { if (open) onTierOpen(t.key); }}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className={`group donor-gift-tier-option ${t.key === "archangel" && pulse ? "donor-gift-tier-pulse" : ""} h-auto min-h-11 w-full justify-between gap-2 whitespace-normal px-3 py-3 text-start text-sm ${activeTierKey === t.key ? "font-semibold" : ""}`}>
                <span className="min-w-0 break-words"><DonorTierName tier={t} /></span>
                <span className="flex shrink-0 items-center gap-2">
                  <span data-no-translate>{money(t.minCents / 100)}+</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="donor-reward-panel px-3 pb-4 pt-3">
                <ul className="list-disc space-y-2 ps-4 text-sm leading-relaxed text-foreground">
                  {(DONOR_REWARDS[t.key] ?? []).map(reward => (
                    <li key={reward.kind} className="break-words">{tr(reward.text)}</li>
                  ))}
                </ul>
                {canSelectAmount && (
                  <Button type="button" variant="donation" className="mt-3 h-auto min-h-10 w-full whitespace-normal text-sm" onClick={() => onSelect(t.key, t.minCents / 100)}>
                    <span data-no-translate>{tr("Donate {amount}").replace("{amount}", money(t.minCents / 100))}</span>
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}