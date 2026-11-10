import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTier } from "../../supabase/functions/_shared/donorTiers";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDonationMoney } from "@/lib/donationCurrency";

interface Props {
  amounts: readonly number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: number | null;
  onSelect: (amount: number) => void;
}

/** "Custom amount" opens preset amounts; each bubble wears the color of the donor tier it reaches. */
export function StoreCustomAmounts({ amounts, open, onOpenChange, selected, onSelect }: Props) {
  const { language, tr } = useLanguage();
  const money = (amount: number) => formatDonationMoney(amount, language);
  if (amounts.length === 0) return null;
  const sorted = [...amounts].sort((a, b) => a - b);
  return (
    <div className="rounded-xl border">
      <Button type="button" variant="ghost" aria-expanded={open} onClick={() => onOpenChange(!open)} className="h-auto w-full justify-between whitespace-normal px-4 py-3 text-sm font-medium">
        <span>{tr("Custom amount")}</span>
        <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </Button>
      {open && (
        <div className="grid grid-cols-5 gap-2 px-3 pb-4">
          {sorted.map(amount => {
            const tierKey = getTier(Math.round(amount * 100))?.key ?? "angel";
            const isSelected = selected === amount;
            return (
              <button
                key={amount}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(amount)}
                className={`donor-tier-${tierKey} donor-preset-chip h-10 rounded-full text-xs font-semibold transition-colors motion-reduce:transition-none`}
              >
                <span data-no-translate>{money(amount)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
