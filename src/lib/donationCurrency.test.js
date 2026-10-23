import { expect, test } from "bun:test";
import { estimateDonation, formatDonationMoney, parseDonationRates } from "./donationCurrency";
const now = Date.UTC(2026, 9, 20);
const response = { result: "success", base_code: "USD", time_last_update_unix: now / 1000, rates: { USD: 1, EUR: 0.92, INR: 84 } };
test("currency estimates leave the selected US-dollar gift unchanged", () => {
  const selectedGift = 2;
  const rates = parseDonationRates(response, now);
  expect(estimateDonation(selectedGift, "EUR", rates)).toBe(1.84);
  expect(estimateDonation(selectedGift, "INR", rates)).toBe(168);
  expect(selectedGift).toBe(2);
  expect(estimateDonation(selectedGift, "USD", null)).toBe(2);
});
test("missing and invalid rates never masquerade as conversions", () => {
  expect(estimateDonation(2, "EUR", null)).toBeNull();
  expect(estimateDonation(2, "GBP", parseDonationRates(response, now))).toBeNull();
  expect(estimateDonation(-1, "USD", null)).toBeNull();
  expect(parseDonationRates({ ...response, base_code: "EUR" }, now)).toBeNull();
  expect(parseDonationRates({ ...response, rates: { USD: 1, EUR: -1 } }, now)?.rates.EUR).toBeUndefined();
});
test("reject exchange rates older than 48 hours", () => {
  expect(parseDonationRates(response, now + 49 * 60 * 60 * 1000)).toBeNull();
  expect(parseDonationRates(response, now + 47 * 60 * 60 * 1000)?.rates.EUR).toBe(0.92);
});
test("gifts show the currency symbol, never the three-letter code", () => {
  expect(formatDonationMoney(2, "en")).toBe("$2");
  expect(formatDonationMoney(2.5, "en")).toBe("$2.50");
  expect(formatDonationMoney(2, "en")).not.toContain("USD");
});
