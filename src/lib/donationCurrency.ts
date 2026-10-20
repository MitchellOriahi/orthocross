/** Display-only estimates; checkout amounts always remain in USD. */
export const DONATION_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "NZD", "CHF", "SEK", "NOK", "DKK", "PLN", "BGN", "RON", "RSD", "RUB", "UAH", "GEL", "AMD", "ILS", "EGP", "SAR", "AED", "ETB", "ERN", "INR", "BRL", "MXN", "ARS", "CLP", "COP", "JPY", "KRW", "CNY", "ZAR", "NGN", "KES"] as const;
export type DonationCurrency = typeof DONATION_CURRENCIES[number];
export interface DonationRates { rates: Record<string, number>; updatedAt: number }
let cached: DonationRates | null = null;
export function parseDonationRates(value: unknown, now = Date.now()): DonationRates | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (data.result !== "success" || data.base_code !== "USD" || typeof data.time_last_update_unix !== "number") return null;
  const updatedAt = data.time_last_update_unix * 1000;
  if (updatedAt > now || now - updatedAt > 48 * 60 * 60 * 1000 || !data.rates || typeof data.rates !== "object") return null;
  const rates: Record<string, number> = {};
  for (const [code, rate] of Object.entries(data.rates)) {
    if (/^[A-Z]{3}$/.test(code) && typeof rate === "number" && Number.isFinite(rate) && rate > 0) rates[code] = rate;
  }
  if (rates.USD !== 1) return null;
  return { rates, updatedAt };
}
export async function loadDonationRates(signal: AbortSignal): Promise<DonationRates> {
  if (cached && Date.now() - cached.updatedAt <= 24 * 60 * 60 * 1000) return cached;
  const response = await fetch("https://open.er-api.com/v6/latest/USD", { signal, credentials: "omit", referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error("Exchange rate unavailable");
  const rates = parseDonationRates(await response.json());
  if (!rates) throw new Error("Exchange rate unavailable");
  cached = rates;
  return rates;
}
export function estimateDonation(usd: number, currency: string, rates: DonationRates | null): number | null {
  if (!Number.isFinite(usd) || usd < 0) return null;
  if (currency === "USD") return usd;
  const rate = rates?.rates[currency];
  return rate && Number.isFinite(rate) && rate > 0 ? usd * rate : null;
}
export function formatDonationMoney(amount: number, language: string, currency = "USD"): string {
  return new Intl.NumberFormat(language, { style: "currency", currency, currencyDisplay: "code", minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount);
}
