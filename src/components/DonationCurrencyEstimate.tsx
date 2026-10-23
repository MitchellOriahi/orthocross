import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DONATION_CURRENCIES, estimateDonation, formatDonationMoney, loadDonationRates, type DonationCurrency, type DonationRates } from "@/lib/donationCurrency";

export function DonationCurrencyEstimate({ amount }: { amount: number }) {
  const { language, tr } = useLanguage();
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<DonationCurrency>(() => {
    try {
      const saved = localStorage.getItem("donation-estimate-currency");
      return DONATION_CURRENCIES.find(code => code === saved) ?? "USD";
    } catch { return "USD"; }
  });
  const [rates, setRates] = useState<DonationRates | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const names = new Intl.DisplayNames([language], { type: "currency" });
  useEffect(() => {
    if (currency === "USD") return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    let alive = true;
    setUnavailable(false);
    loadDonationRates(controller.signal).then(data => {
      if (alive) setRates(data);
    }).catch(() => { if (alive) setUnavailable(true); }).finally(() => window.clearTimeout(timeout));
    return () => { alive = false; controller.abort(); window.clearTimeout(timeout); };
  }, [currency]);
  const estimate = estimateDonation(amount, currency, rates);
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={tr("Currency estimate")}
            className={`absolute right-0 top-0 z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors ${currency === "USD" ? "border-border text-muted-foreground hover:bg-muted hover:text-foreground" : "border-primary/50 text-primary"}`}
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="z-[150] w-72 space-y-2 p-3 text-xs">
          <p className="text-sm font-medium">{tr("Exchange rates")}</p>
          <Select value={currency} onValueChange={value => {
            const next = DONATION_CURRENCIES.find(code => code === value);
            if (!next) return;
            setCurrency(next);
            try { localStorage.setItem("donation-estimate-currency", next); } catch { /* private mode */ }
          }}>
            <SelectTrigger aria-label={tr("Currency estimate")} className="h-auto min-h-9 w-full gap-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[160]">
              {DONATION_CURRENCIES.map(code => <SelectItem key={code} value={code}><span data-no-translate>{code} · {names.of(code) ?? code}</span></SelectItem>)}
            </SelectContent>
          </Select>
          <div className="space-y-1 text-muted-foreground" data-no-translate>
            {currency !== "USD" && estimate !== null && <p>{tr("Estimated equivalent")} ≈ {formatDonationMoney(estimate, language, currency)}</p>}
            {currency !== "USD" && rates && <p>{tr("Rate date: {date}").replace("{date}", new Intl.DateTimeFormat(language).format(rates.updatedAt))}</p>}
            {currency !== "USD" && estimate === null && (unavailable || rates) && <p>{tr("Exchange rate unavailable")}</p>}
            <p>{tr("Charged in US dollars. Your bank’s rate and fees may differ.")}</p>
            <p><a className="underline" href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">ExchangeRate-API</a></p>
          </div>
        </PopoverContent>
      </Popover>
      {currency !== "USD" && estimate !== null && (
        <p className="text-center text-xs text-muted-foreground" data-no-translate aria-live="polite">{tr("Estimated equivalent")} ≈ {formatDonationMoney(estimate, language, currency)}</p>
      )}
    </>
  );
}
