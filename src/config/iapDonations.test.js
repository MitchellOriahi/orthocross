import { describe, expect, test } from "bun:test";
import { parseRevenueCatEvent, iapDonationType } from "../../supabase/functions/_shared/iapDonations";

const USER = "11111111-2222-3333-4444-555555555555";
const event = (over) => ({
  type: "RENEWAL", product_id: "support_month_2", transaction_id: "2000000123",
  app_user_id: USER, environment: "PRODUCTION", ...over,
});

describe("App Store renewals count toward donor tiers", () => {
  test("a $2 monthly renewal records $2", () => {
    expect(parseRevenueCatEvent(event())).toMatchObject({ kind: "payment", userId: USER, amount: 200, status: "confirmed" });
  });
  test("a $12 yearly renewal records $12", () => {
    expect(parseRevenueCatEvent(event({ product_id: "support_year_12" }))).toMatchObject({ amount: 1200 });
  });
  test("the first subscription payment is recorded too", () => {
    expect(parseRevenueCatEvent(event({ type: "INITIAL_PURCHASE" }))?.kind).toBe("payment");
  });
  test("subscription gifts are recurring, store one-time gifts stay one-time", () => {
    expect(iapDonationType("support_year_8")).toBe("monthly");
    expect(iapDonationType("donation_10")).toBe("one-time");
  });
  test("sandbox renewals never count", () => {
    expect(parseRevenueCatEvent(event({ environment: "SANDBOX" }))?.status).toBe("sandbox");
  });
  test("unknown products are ignored", () => {
    expect(parseRevenueCatEvent(event({ product_id: "support_month_999" }))).toBeNull();
  });
  test("cancelling auto-renew records nothing", () => {
    expect(parseRevenueCatEvent(event({ type: "CANCELLATION", cancel_reason: "UNSUBSCRIBE" }))).toBeNull();
  });
  test("an Apple refund is reported as a refund", () => {
    expect(parseRevenueCatEvent(event({ type: "CANCELLATION", cancel_reason: "CUSTOMER_SUPPORT" }))).toEqual({ kind: "refund", transactionId: "2000000123" });
  });
  test("events without an account id are ignored", () => {
    expect(parseRevenueCatEvent(event({ app_user_id: "$RCAnonymousID:abc", original_app_user_id: null }))).toBeNull();
  });
});
