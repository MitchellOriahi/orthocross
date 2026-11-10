// App Store / Play Store donation products. Amounts (USD cents) are decided here, never by the client.
export const IAP_AMOUNTS: Record<string, number> = {
  donation_5: 500, donation_10: 1000, donation_25: 2500, donation_50: 5000,
  support_month_1: 100, support_month_2: 200, support_month_5: 500,
  support_year_8: 800, support_year_12: 1200, support_year_16: 1600,
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
