import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DonorTierName } from "./DonorTierName";
import { groupAmountsByTier } from "@/config/donationGift";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDonationMoney } from "@/lib/donationCurrency";

interface Props {
  amounts: readonly number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: number | null;
  onSelect: (amount: number) => void;
}

/** App stores sell fixed prices, so "Custom amount" opens preset amounts grouped by donor tier. */
export function StoreCustomAmounts({ amounts, open, onOpenChange, selected, onSelect }: Props) {
  const { language, tr } = useLanguage();
  const money = (amount: number) => formatDonationMoney(amount, language);
  if (amounts.length === 0) return null;
  return (
    <div className="rounded-xl border">
      <Button type="button" variant="ghost" aria-expanded={open} onClick={() => onOpenChange(!open)} className="h-auto w-full justify-between whitespace-normal px-4 py-3 text-sm font-medium">
        <span>{tr("Custom amount")}</span>
        <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </Button>
      {open && (
        <div className="space-y-3 px-4 pb-4">
          {groupAmountsByTier(amounts).map(({ tier, amounts: tierAmounts }) => (
            <div key={tier.key} className={`donor-tier-${tier.key} space-y-2`}>
              <p className="text-xs font-semibold text-muted-foreground"><DonorTierName tier={tier} /></p>
              <div className="grid grid-cols-3 gap-2">
                {tierAmounts.map(amount => (
                  <Button key={amount} type="button" variant={selected === amount ? "sacred" : "outline"} aria-pressed={selected === amount} onClick={() => onSelect(amount)} className="h-10 rounded-full text-sm">
                    <span data-no-translate>{money(amount)}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
