export function donorDuration(donationCount: number | null | undefined) {
  if (donationCount == null || !Number.isSafeInteger(donationCount) || donationCount < 1) return null;
  const months = donationCount;
  return months >= 12
    ? { unit: "year" as const, count: Math.floor(months / 12) }
    : { unit: "month" as const, count: months };
}