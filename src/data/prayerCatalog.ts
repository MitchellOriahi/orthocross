import { prayersContent } from "./prayersContent";
import { prayerAdditions } from "./prayerAdditions";
import { PRAYER_CATEGORIES, PRAYER_PLACEMENTS, type PrayerCategoryId } from "./prayerCategories";
import { matchesPrayerQuery, matchesPrayerTradition, type PrayerTraditionFilter } from "./prayerSearch";

// The original records are retained by reference, preserving IDs, pins and highlights.
export const prayerCatalog = [...prayersContent, ...prayerAdditions];

export function getPrayerList(category: PrayerCategoryId | null = null, subgroup: string | null = null, query = "", tradition: PrayerTraditionFilter = "all", pinnedIds: ReadonlySet<string> = new Set()) {
  const filtered = prayerCatalog.filter(prayer =>
    (!category || PRAYER_PLACEMENTS[prayer.id]?.some(placement => placement.category === category && (!subgroup || placement.subgroup === subgroup))) &&
    matchesPrayerQuery(prayer, query) && matchesPrayerTradition(prayer, tradition)
  );
  // Preserve pinned-first and shared/Eastern/Oriental interleaving from the old list.
  const pinned = filtered.filter(prayer => pinnedIds.has(prayer.id));
  const unpinned = filtered.filter(prayer => !pinnedIds.has(prayer.id));
  if (tradition !== "all") return [...pinned, ...unpinned];
  const shared = unpinned.filter(prayer => prayer.tradition === "Eastern/Oriental");
  const eastern = unpinned.filter(prayer => prayer.tradition === "Eastern");
  const oriental = unpinned.filter(prayer => prayer.tradition === "Oriental");
  for (let index = 0; index < Math.max(eastern.length, oriental.length); index++) {
    if (eastern[index]) shared.push(eastern[index]);
    if (oriental[index]) shared.push(oriental[index]);
  }
  return [...pinned, ...shared];
}

export function getPrayerSubgroups(category: PrayerCategoryId) {
  return PRAYER_CATEGORIES.find(item => item.id === category)?.subgroups.filter(subgroup =>
    prayerCatalog.some(prayer => PRAYER_PLACEMENTS[prayer.id]?.some(placement => placement.category === category && placement.subgroup === subgroup))
  ) ?? [];
}