import { differenceInMonths } from "date-fns";

export function donorDuration(firstDonation: string | null | undefined, now = new Date()) {
  if (!firstDonation) return null;
  const start = new Date(firstDonation);
  if (!Number.isFinite(start.getTime()) || start > now) return null;
  const months = differenceInMonths(now, start);
  return months >= 12
    ? { unit: "year" as const, count: Math.floor(months / 12) }
    : { unit: "month" as const, count: months };
}