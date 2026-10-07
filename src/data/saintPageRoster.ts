import roster from "./saintPageRoster.json";
// Synaxaria-researched life stories (8–12 cards) keyed by roster id; preserved biographies stay untouched.
import saintStories from "./saintStories.json";
import { saintsContent } from "./saintsContent";
import type { SaintDetail } from "./saintTypes";
import type { SaintCategoryId } from "./saintCategories";
import { CATEGORY_SUBCATEGORIES } from "./saintBrowser";

type Membership = { category: string; subgroup: string };
const savedById = new Map(saintsContent.map(saint => [saint.id, saint]));
const memberships = new Map<string, Membership[]>();

export function saintSortName(name: string) {
  return name.replace(/^(?:(?:St\.|Prophet|Righteous|Archangel|Abba|Amma|The)\s+)+/i, "");
}

export const saintPageRoster: SaintDetail[] = roster.map(record => {
  const saved = record.savedId ? savedById.get(record.savedId) : undefined;
  memberships.set(record.id, record.memberships);
  return {
    id: record.id,
    prefix: record.prefix,
    name: record.name,
    epithet: "",
    shortDescription: record.subtitle,
    tradition: record.tradition as SaintDetail["tradition"],
    iconUrl: saved?.iconUrl ?? "",
    iconCredit: saved?.iconCredit,
    content: (saintStories as Record<string, string[]>)[record.id] ?? saved?.content ?? [record.subtitle],
  };
});

export type SaintTraditionFilter = "all" | "Eastern" | "Oriental";

export function getSaintPageList(category: SaintCategoryId | null, subgroup: string | null = null, query = "", tradition: SaintTraditionFilter = "all") {
  const needle = query.trim().toLocaleLowerCase();
  return saintPageRoster.filter(saint =>
    (tradition === "all" || saint.tradition === tradition || saint.tradition === "Eastern/Oriental") &&
    (!category || memberships.get(saint.id)?.some(item => item.category === category && (!subgroup || item.subgroup === subgroup))) &&
    (!needle || `${saint.prefix} ${saint.name}`.toLocaleLowerCase().includes(needle))
  ).sort((a, b) => saintSortName(a.name).localeCompare(saintSortName(b.name), "en"));
}

export function getSaintMemberships(saintId: string): Membership[] {
  return memberships.get(saintId) ?? [];
}

export function getSaintPageSubgroups(category: SaintCategoryId) {
  return (CATEGORY_SUBCATEGORIES[category] ?? []).filter(subgroup => getSaintPageList(category, subgroup).length > 0);
}