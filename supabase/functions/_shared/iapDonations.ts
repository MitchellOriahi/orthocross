// App Store / Play Store donation products. Amounts (USD cents) are decided here, never by the client.

/** Monthly and yearly amounts the store sells: slider stops plus the "Custom amount" presets. */
export const STORE_SLIDER_AMOUNTS = { month: [1, 2, 5], year: [8, 12, 16] } as const;
/** Presets shown under "Custom amount", per interval: yearly adds $20 and keeps the website's minimum. */
export const STORE_CUSTOM_AMOUNTS = {
  month: [3, 10, 15, 25, 50, 100, 250, 500, 750, 1000],
  year: [10, 15, 20, 25, 50, 100, 250, 500, 750, 1000],
} as const;
const STORE_MIN = { month: 1, year: 8 } as const;
export type StoreInterval = keyof typeof STORE_SLIDER_AMOUNTS;

/** Every whole-dollar amount with its own Apple subscription for this interval, ascending. */
export const storeSubscriptionAmounts = (interval: StoreInterval): number[] =>
  [...new Set<number>([...STORE_SLIDER_AMOUNTS[interval], ...STORE_CUSTOM_AMOUNTS[interval]])]
    .filter((a) => a >= STORE_MIN[interval])
    .sort((a, b) => a - b);

/** Presets shown under "Custom amount" for this interval (yearly keeps the website's minimum). */
export const storeCustomAmounts = (interval: StoreInterval): number[] =>
  [...STORE_CUSTOM_AMOUNTS[interval]].filter((a) => a >= STORE_MIN[interval]);

export const subscriptionProductId = (interval: StoreInterval, amount: number): string | null =>
  storeSubscriptionAmounts(interval).includes(amount) ? `support_${interval}_${amount}` : null;

export const IAP_AMOUNTS: Record<string, number> = {
  donation_5: 500, donation_10: 1000, donation_25: 2500, donation_50: 5000,
  ...Object.fromEntries((Object.keys(STORE_SLIDER_AMOUNTS) as StoreInterval[]).flatMap((interval) =>
    storeSubscriptionAmounts(interval).map((a) => [`support_${interval}_${a}`, a * 100]))),
};

export const isSubscriptionProduct = (productId: string) => productId.startsWith("support_");

// Recurring store gifts share the Stripe label so tenure and tiers treat both stores alike.
export const iapDonationType = (productId: string) => (isSubscriptionProduct(productId) ? "monthly" : "one-time");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRANSACTION_ID = /^[A-Za-z0-9._:-]{1,200}$/;

// RevenueCat events that mean money was actually paid.
const PAYMENT_EVENTS = new Set(["INITIAL_PURCHASE", "RENEWAL", "NON_RENEWING_PURCHASE"]);

export type StorePayment = {
  kind: "payment";
  userId: string; productId: string; transactionId: string;
  amount: number; donationType: string; status: "confirmed" | "sandbox";
};
export type StoreRefund = { kind: "refund"; transactionId: string };

// Pure translation of a RevenueCat webhook event into what the donations table needs.
// deno-lint-ignore no-explicit-any
export function parseRevenueCatEvent(event: any): StorePayment | StoreRefund | null {
  if (!event || typeof event !== "object") return null;
  const transactionId = typeof event.transaction_id === "string" && TRANSACTION_ID.test(event.transaction_id)
    ? event.transaction_id : null;
  if (!transactionId) return null;

  if (event.type === "CANCELLATION" && event.cancel_reason === "CUSTOMER_SUPPORT") {
    return { kind: "refund", transactionId };
  }
  if (!PAYMENT_EVENTS.has(event.type)) return null;

  const productId = typeof event.product_id === "string" ? event.product_id : "";
  const amount = IAP_AMOUNTS[productId];
  if (!amount) return null;

  // The app logs RevenueCat in with the account id; fall back to the original id for older installs.
  const userId = [event.app_user_id, event.original_app_user_id].find((v) => typeof v === "string" && UUID.test(v));
  if (!userId) return null;

  return {
    kind: "payment", userId, productId, transactionId, amount,
    donationType: iapDonationType(productId),
    status: event.environment === "SANDBOX" ? "sandbox" : "confirmed",
  };
}
