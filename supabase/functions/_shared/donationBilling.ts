export type DonationInterval = "month" | "year";
export const DEFAULT_DONATION_INTERVAL: DonationInterval = "month";

export function donationInterval(value: unknown): DonationInterval {
  if (value === undefined) return DEFAULT_DONATION_INTERVAL;
  if (value === "month" || value === "year") return value;
  throw new Error("Choose monthly or yearly billing.");
}