import { filterSaintsByCategory, type SaintCategoryId } from "./saintCategories";
import type { SaintDetail } from "./saintTypes";
import { getVisibleSaints, SAINTS_VISIBLE } from "./saintsVisibility";

export const MIN_SAINTS_PER_TAG = 3;

export const ANGEL_SUBCATEGORIES = [
  "Archangels",
  "Heavenly Orders",
  "Guardians",
  "Witnesses",
  "Appearances",
] as const;

export const BIBLICAL_SUBCATEGORIES = ["Forefathers", "Prophets", "Kings", "Holy Family", "Myrrh-bearers", "Gospel Era", "The Twelve", "The Seventy"] as const;

export const MISSIONARY_SUBCATEGORIES = [
  "Equal-to-Apostles",
  "Enlighteners",
  "Slavs",
  "Caucasus",
  "Africa",
  "Asia & Americas",
] as const;

export const FATHER_SUBCATEGORIES = ["Three Hierarchs", "Apostolic", "Cappadocians", "Syriac", "Wonderworkers", "Confessors", "Theologians", "Western Fathers"] as const;

export const MONASTIC_SUBCATEGORIES = [
  "Desert Fathers",
  "Desert Mothers",
  "Founders",
  "Stylites",
  "Holy Fools",
  "Athonites",
  "Kiev Caves",
  "Elders",
] as const;

export const MARTYR_SUBCATEGORIES = ["Early Martyrs", "Great-martyrs", "Hieromartyrs", "Soldiers", "Women", "Neomartyrs", "Passion-bearers", "Modern"] as const;
export const LAYPEOPLE_SUBCATEGORIES = ["Emperors", "Kings & Princes", "Parents", "Children", "Healers", "Public Life", "Modern"] as const;

// Sub-category pill labels shown on a category page, in order.
export const CATEGORY_SUBCATEGORIES: Partial<Record<SaintCategoryId, readonly string[]>> = {
  angels: ANGEL_SUBCATEGORIES,
  biblical: BIBLICAL_SUBCATEGORIES,
  "apostles-missionaries": MISSIONARY_SUBCATEGORIES,
  "fathers-hierarchs": FATHER_SUBCATEGORIES,
  monastics: MONASTIC_SUBCATEGORIES,
  martyrs: MARTYR_SUBCATEGORIES,
  laypeople: LAYPEOPLE_SUBCATEGORIES,
};

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

// Curated factual sub-groupings for category pages with sub-category pills.
// Every listed saint must belong to that category in saintCategories.ts.
export const SAINT_SUBCATEGORY_MEMBERS: Record<string, readonly string[]> = {
  "Equal-to-Apostles": ["thekla-iconium", "cyril-slavs", "methodius-slavs", "nino-georgia", "innocent-alaska", "nicholas-japan"],
  "Enlighteners": ["cyril-slavs", "methodius-slavs", "nino-georgia", "gregory-illuminator", "stephen-perm", "innocent-alaska", "nicholas-japan"],
  "Slavs": ["cyril-slavs", "methodius-slavs", "stephen-perm"],
  "Caucasus": ["nino-georgia", "gregory-illuminator"],
  "Africa": ["mark"],
  "Asia & Americas": ["thomas-apostle", "nicholas-japan", "innocent-alaska"],
  "Forefathers": [],
  "Prophets": ["john-the-baptist"],
  "Kings": [],
  "Holy Family": ["theotokos"],
  "Myrrh-bearers": ["mary-magdalene"],
  "Gospel Era": ["theotokos", "john-the-baptist", "mary-magdalene", "james-brother-of-the-lord", "stephen-protomartyr", "philip-the-deacon"],
  "The Twelve": [], // The saved Twelve remain in Apostles and Missionaries.
  "The Seventy": ["james-brother-of-the-lord", "philip-the-deacon"],
  "Three Hierarchs": ["basil", "saint-gregory-nazianzus", "john-chrysostom"],
  "Apostolic": ["saint-ignatius-antioch", "saint-polycarp-smyrna", "saint-clement-rome"],
  "Cappadocians": ["basil", "saint-gregory-nazianzus", "saint-gregory-nyssa"],
  "Syriac": ["saint-ephrem-syrian", "saint-isaac-syrian", "jacob-serugh"],
  "Wonderworkers": ["saint-gregory-wonderworker", "saint-spyridon-trimythous", "nicholas", "nektarios-aegina", "john-shanghai-sanfrancisco"],
  "Confessors": ["saint-maximus-confessor"],
  "Theologians": ["saint-gregory-nazianzus", "saint-john-damascus", "gregory-palamas"],
  "Western Fathers": ["saint-ambrose-milan", "saint-cyprian-carthage", "saint-irenaeus-lyons", "saint-clement-rome"],
  "Desert Fathers": ["anthony", "paul-of-thebes", "macarius-great", "pachomius-great", "bishoy-great", "moses-black", "shenoute-archimandrite", "saint-john-climacus"],
  "Desert Mothers": ["macrina-younger", "mary-egypt", "syncletica-alexandria"],
  "Founders": ["anthony", "pachomius-great", "sergius-radonezh"],
  // No stylite or holy-fool saints exist in the saved collection yet;
  // these pills stay visible (empty) until matching saints join.
  "Stylites": [],
  "Holy Fools": [],
  "Kiev Caves": [],
  "Athonites": ["paisios-athonite", "silouan-athonite", "nicodemus-hagiorite"],
  "Elders": ["paisios-athonite", "silouan-athonite", "seraphim-sarov", "herman-alaska"],
  "Early Martyrs": ["saint-justin-martyr", "catherine", "george", "saint-panteleimon", "saint-demetrius-thessalonica", "saint-barbara", "saint-paraskeva-iconium", "menas-wonderworker", "mercurius-soldier", "hripsime-armenia", "margaret-marina", "anastasia-sirmium"],
  "Great-martyrs": ["catherine", "george", "saint-panteleimon", "saint-demetrius-thessalonica", "saint-barbara", "margaret-marina", "anastasia-sirmium"],
  "Hieromartyrs": [],
  "Soldiers": ["george", "saint-demetrius-thessalonica", "mercurius-soldier", "menas-wonderworker"],
  "Women": ["catherine", "saint-barbara", "saint-paraskeva-iconium", "hripsime-armenia", "margaret-marina", "anastasia-sirmium"],
  "Neomartyrs": [],
  "Passion-bearers": [],
  "martyrs.Modern": [],
  "Emperors": [], // Holy Rulers' saved classification remains intact.
  "Kings & Princes": [],
  "Parents": ["monica-hippo"],
  "Children": [],
  "Healers": ["matrona-moscow"],
  "Public Life": [],
  "laypeople.Modern": ["matrona-moscow"],
};

export function getSubcategorySaints(saints: SaintDetail[], category: SaintCategoryId | null, subcategory: string | null) {
  if (!subcategory || !category) return saints;
  const ids = SAINT_SUBCATEGORY_MEMBERS[`${category}.${subcategory}`] ?? SAINT_SUBCATEGORY_MEMBERS[subcategory] ?? [];
  return saints.filter(saint => ids.includes(saint.id));
}

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