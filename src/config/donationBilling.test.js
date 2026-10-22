import { describe, expect, test } from "bun:test";
import { DEFAULT_DONATION_INTERVAL, donationInterval } from "../../supabase/functions/_shared/donationBilling";

describe("donation billing", () => {
  test("yearly is the default", () => {
    expect(DEFAULT_DONATION_INTERVAL).toBe("year");
    expect(donationInterval(undefined)).toBe("year");
  });
  test("yearly bills once per year", () => {
    expect(donationInterval("year")).toBe("year");
  });
  test("monthly bills once per month", () => {
    expect(donationInterval("month")).toBe("month");
  });
  test("one-time is not a recurring billing option", () => {
    expect(() => donationInterval("one-time")).toThrow();
  });
});