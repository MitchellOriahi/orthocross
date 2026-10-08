import roster from "./saintPageRoster.json";
// Synaxaria-researched life stories (8–12 cards) keyed by roster id; preserved biographies stay untouched.
import saintStories from "./saintStories.json";
import { saintsContent } from "./saintsContent";
import type { SaintDetail } from "./saintTypes";
import type { SaintCategoryId } from "./saintCategories";
import { CATEGORY_SUBCATEGORIES } from "./saintBrowser";
import { SAINT_CARD_ICONS } from "./saintCardIcons";

type Membership = { category: string; subgroup: string };
const savedById = new Map(saintsContent.map(saint => [saint.id, saint]));
// These are the same people under alternate roster spellings, not new saints.
const portraitAliases: Record<string, string> = {
  "jude-thaddaeus": "jude-thaddeus",
  paul: "paul-apostle",
  philip: "philip-apostle",
  cyril: "cyril-slavs",
  "mark-the-evangelist": "mark",
};
const memberships = new Map<string, Membership[]>();

export function saintSortName(name: string) {
  return name.replace(/^(?:(?:St\.|Prophet|Righteous|Archangel|Abba|Amma|The)\s+)+/i, "");
}

export const saintPageRoster: SaintDetail[] = roster.map(record => {
  const saved = record.savedId ? savedById.get(record.savedId) : undefined;
  const savedPortrait = saved ?? savedById.get(portraitAliases[record.id]);
  const portrait = SAINT_CARD_ICONS[record.id];
  memberships.set(record.id, record.memberships);
  return {
    id: record.id,
    prefix: record.prefix,
    name: record.name,
    epithet: "",
    shortDescription: record.subtitle,
    tradition: record.tradition as SaintDetail["tradition"],
    iconUrl: portrait?.image_url ?? savedPortrait?.iconUrl ?? "",
    iconCredit: portrait ? {
      source: portrait.image_source,
      author: portrait.image_attribution,
      license: portrait.image_license,
      licenseUrl: portrait.image_license === "Public domain"
        ? "https://creativecommons.org/publicdomain/mark/1.0/"
        : portrait.image_license === "CC0"
          ? "https://creativecommons.org/publicdomain/zero/1.0/"
          : `https://creativecommons.org/licenses/${portrait.image_license.includes("BY-SA") ? "by-sa" : "by"}/${portrait.image_license.match(/\d\.\d/)?.[0] ?? "4.0"}/`,
      title: [record.prefix, record.name].filter(Boolean).join(" "),
      modification: "Source image resized and face-focused for the circular profile picture; no recoloring or generated artwork.",
    } : savedPortrait?.iconCredit,
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