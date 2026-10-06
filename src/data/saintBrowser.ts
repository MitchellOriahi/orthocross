import { filterSaintsByCategory, type SaintCategoryId } from "./saintCategories";
import type { SaintDetail } from "./saintTypes";
import { getVisibleSaints, SAINTS_VISIBLE } from "./saintsVisibility";

export const MIN_SAINTS_PER_TAG = 3;

// Curated factual groupings, independent of saved biographies and image fields.
export const SAINT_TAG_MEMBERS: Record<string, readonly string[]> = {
  "The Twelve": ["peter-apostle", "andrew-first-called", "james-son-of-zebedee", "john-theologian", "philip-apostle", "bartholomew-apostle", "thomas-apostle", "matthew-evangelist", "james-son-of-alphaeus", "jude-thaddeus", "simon-zealot", "matthias-apostle"],
  Evangelist: ["matthew-evangelist", "mark", "luke-evangelist", "john-theologian"],
  Enlightener: ["cyril-slavs", "methodius-slavs", "nino-georgia", "gregory-illuminator", "innocent-alaska", "nicholas-japan", "stephen-perm"],
  Wonderworker: ["nicholas", "saint-spyridon-trimythous", "saint-gregory-wonderworker", "nektarios-aegina", "john-shanghai-sanfrancisco", "seraphim-sarov", "sergius-radonezh"],
  Cappadocian: ["basil", "saint-gregory-nazianzus", "saint-gregory-nyssa"],
  "Syriac Father": ["saint-ephrem-syrian", "saint-isaac-syrian", "jacob-serugh"],
  Athonite: ["paisios-athonite", "silouan-athonite", "nicodemus-hagiorite"],
  "Desert Father": ["anthony", "paul-of-thebes", "macarius-great", "pachomius-great", "bishoy-great", "moses-black"],
  "Military Saint": ["george", "saint-demetrius-thessalonica", "mercurius-soldier", "menas-wonderworker"],
  "Women Martyrs": ["catherine", "saint-barbara", "saint-paraskeva-iconium", "hripsime-armenia", "margaret-marina", "anastasia-sirmium"],
  "Equal-to-the-Apostles": ["constantine-great", "helena-equal-apostles", "vladimir-kyiv", "olga-kyiv", "mary-magdalene", "thekla-iconium", "nino-georgia", "nicholas-japan"],
};

export function getCategoryCount(catalog: SaintDetail[], category: SaintCategoryId) {
  return filterSaintsByCategory(catalog, category).length;
}

export function getCategoryTags(catalog: SaintDetail[], category: SaintCategoryId) {
  const members = filterSaintsByCategory(catalog, category);
  return Object.entries(SAINT_TAG_MEMBERS)
    .map(([label, ids]) => ({ label, count: members.filter(saint => ids.includes(saint.id)).length }))
    .filter(tag => tag.count >= MIN_SAINTS_PER_TAG);
}

export function getCategorySaints(catalog: SaintDetail[], category: SaintCategoryId | null, query = "", tag: string | null = null, visible = SAINTS_VISIBLE) {
  const needle = query.trim().toLocaleLowerCase();
  return filterSaintsByCategory(getVisibleSaints(catalog, visible), category).filter(saint =>
    (!needle || `${saint.prefix} ${saint.name} ${saint.epithet} ${saint.shortDescription}`.toLocaleLowerCase().includes(needle)) &&
    (!tag || SAINT_TAG_MEMBERS[tag]?.includes(saint.id))
  );
}