/** Only new checkouts use these prices; existing subscriptions are never changed. */
export const SUPPORT_PRICES: Record<string, string> = {
  "year:800": "price_1UTBTBFLYUoHeT5Q9nHjQSki",
  "year:1200": "price_1UTBTyFLYUoHeT5Q48PwbpGt",
  "year:1600": "price_1UTBUVFLYUoHeT5QhtjvofEP",
  "month:299": "price_1UTBUqFLYUoHeT5QTkYBv90B",
};
export const MIN_YEARLY_CENTS = 800;
export const FEATURED_MONTHLY_AMOUNT = 2.99;
export const FEATURED_YEARLY_AMOUNT = 12;
export function annualComparison(yearly: number) {
  const monthlyYear = Math.round(FEATURED_MONTHLY_AMOUNT * 12 * 100) / 100;
  return { monthlyYear, savings: Math.max(0, Math.round((monthlyYear - yearly) * 100) / 100) };
}