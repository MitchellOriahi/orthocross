import type { PrayerDetail } from "./prayersContent";

export type PrayerTraditionFilter = "all" | "Eastern" | "Oriental";

// Prayer search matches the prayer's name or its short title, ignoring letter
// case, curly-versus-straight quotes and repeated spaces.
export function normalizePrayerText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesPrayerQuery(prayer: PrayerDetail, query: string) {
  const needle = normalizePrayerText(query);
  if (!needle) return true;
  return (
    normalizePrayerText(prayer.name).includes(needle) ||
    normalizePrayerText(prayer.title).includes(needle)
  );
}

export function matchesPrayerTradition(prayer: PrayerDetail, filter: PrayerTraditionFilter) {
  if (filter === "all") return true;
  if (filter === "Eastern") return prayer.tradition === "Eastern" || prayer.tradition === "Eastern/Oriental";
  if (filter === "Oriental") return prayer.tradition === "Oriental" || prayer.tradition === "Eastern/Oriental";
  return false;
}
