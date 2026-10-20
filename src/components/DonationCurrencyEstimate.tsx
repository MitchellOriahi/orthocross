import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DONATION_CURRENCIES, estimateDonation, formatDonationMoney, loadDonationRates, type DonationCurrency, type DonationRates } from "@/lib/donationCurrency";

export function DonationCurrencyEstimate({ amount }: { amount: number }) {
  const { language, tr } = useLanguage();
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
    <div className="w-full space-y-2 text-center">
      <Select value={currency} onValueChange={value => {
        const next = DONATION_CURRENCIES.find(code => code === value);
        if (!next) return;
        setCurrency(next);
        try { localStorage.setItem("donation-estimate-currency", next); } catch { /* private mode */ }
      }}>
        <SelectTrigger aria-label={tr("Currency estimate")} className="mx-auto h-auto min-h-10 w-full max-w-xs gap-2 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[150]">
          {DONATION_CURRENCIES.map(code => <SelectItem key={code} value={code}><span data-no-translate>{code} · {names.of(code) ?? code}</span></SelectItem>)}
        </SelectContent>
      </Select>
      {currency !== "USD" && (
        <div className="space-y-1 text-xs text-muted-foreground" data-no-translate aria-live="polite">
          {estimate !== null ? <>
            <p>{tr("Estimated equivalent")} ≈ {formatDonationMoney(estimate, language, currency)}</p>
            {rates && <p>{tr("Rate date: {date}").replace("{date}", new Intl.DateTimeFormat(language).format(rates.updatedAt))}</p>}
          </> : unavailable ? <p>{tr("Exchange rate unavailable")}</p> : null}
          <p>{tr("Charged in US dollars. Your bank’s rate and fees may differ.")}</p>
          <p><a className="underline" href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">ExchangeRate-API</a></p>
        </div>
      )}
    </div>
  );
}
