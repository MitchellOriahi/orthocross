// Category taxonomy for the Saints section.
// The catalog itself is untouched — this file only classifies existing saints
// so the category boxes can filter the saved collection when it is shown.

export type SaintCategoryId =
  | "angels"
  | "biblical"
  | "apostles-missionaries"
  | "fathers-hierarchs"
  | "monastics"
  | "martyrs"
  | "rulers"
  | "laypeople";

export interface SaintCategory {
  id: SaintCategoryId;
  label: string;
}

// Row order: each row renders two boxes side by side.
export const SAINT_CATEGORIES: SaintCategory[] = [
  { id: "angels", label: "Angels and Archangels" },
  { id: "biblical", label: "Biblical Saints" },
  { id: "apostles-missionaries", label: "Apostles and Missionaries" },
  { id: "fathers-hierarchs", label: "Church Fathers and Hierarchs" },
  { id: "monastics", label: "Monastics" },
  { id: "martyrs", label: "Martyrs" },
  { id: "rulers", label: "Holy Rulers" },
  { id: "laypeople", label: "Righteous Laypeople" },
];

const SAINT_CATEGORY_BY_ID: Record<string, SaintCategoryId> = {
  // Angels and Archangels
  // (no angel saints in the current catalog; the category is kept for future use)

  // Biblical Saints (named in Scripture, outside the Twelve)
  "theotokos": "biblical",
  "john-the-baptist": "biblical",
  "stephen-protomartyr": "biblical",
  "mary-magdalene": "biblical",
  "james-brother-of-the-lord": "biblical",
  "philip-the-deacon": "biblical",

  // Apostles and Missionaries
  "peter-apostle": "apostles-missionaries",
  "andrew-first-called": "apostles-missionaries",
  "james-son-of-zebedee": "apostles-missionaries",
  "john-theologian": "apostles-missionaries",
  "philip-apostle": "apostles-missionaries",
  "bartholomew-apostle": "apostles-missionaries",
  "thomas-apostle": "apostles-missionaries",
  "matthew-evangelist": "apostles-missionaries",
  "james-son-of-alphaeus": "apostles-missionaries",
  "jude-thaddeus": "apostles-missionaries",
  "simon-zealot": "apostles-missionaries",
  "matthias-apostle": "apostles-missionaries",
  "paul-apostle": "apostles-missionaries",
  "mark": "apostles-missionaries",
  "luke-evangelist": "apostles-missionaries",
  "barnabas-apostle": "apostles-missionaries",
  "timothy-apostle": "apostles-missionaries",
  "titus-apostle": "apostles-missionaries",
  "cyril-slavs": "apostles-missionaries",
  "methodius-slavs": "apostles-missionaries",
  "nino-georgia": "apostles-missionaries",
  "gregory-illuminator": "apostles-missionaries",
  "nicholas-japan": "apostles-missionaries",
  "innocent-alaska": "apostles-missionaries",
  "stephen-perm": "apostles-missionaries",
  "thekla-iconium": "apostles-missionaries",

  // Church Fathers and Hierarchs
  "saint-ignatius-antioch": "fathers-hierarchs",
  "saint-polycarp-smyrna": "fathers-hierarchs",
  "saint-irenaeus-lyons": "fathers-hierarchs",
  "saint-clement-rome": "fathers-hierarchs",
  "saint-cyprian-carthage": "fathers-hierarchs",
  "saint-ambrose-milan": "fathers-hierarchs",
  "saint-gregory-nazianzus": "fathers-hierarchs",
  "saint-gregory-nyssa": "fathers-hierarchs",
  "saint-cyril-jerusalem": "fathers-hierarchs",
  "saint-cyril-alexandria": "fathers-hierarchs",
  "saint-ephrem-syrian": "fathers-hierarchs",
  "saint-isaac-syrian": "fathers-hierarchs",
  "saint-john-damascus": "fathers-hierarchs",
  "saint-maximus-confessor": "fathers-hierarchs",
  "saint-gregory-wonderworker": "fathers-hierarchs",
  "saint-spyridon-trimythous": "fathers-hierarchs",
  "athanasius": "fathers-hierarchs",
  "basil": "fathers-hierarchs",
  "john-chrysostom": "fathers-hierarchs",
  "nicholas": "fathers-hierarchs",
  "nektarios-aegina": "fathers-hierarchs",
  "dimitry-rostov": "fathers-hierarchs",
  "tikhon-zadonsk": "fathers-hierarchs",
  "john-shanghai-sanfrancisco": "fathers-hierarchs",
  "gregory-palamas": "fathers-hierarchs",
  "severus-antioch": "fathers-hierarchs",
  "dioscorus-alexandria": "fathers-hierarchs",
  "jacob-serugh": "fathers-hierarchs",
  "sava-serbia": "fathers-hierarchs",

  // Monastics
  "anthony": "monastics",
  "paul-of-thebes": "monastics",
  "macarius-great": "monastics",
  "pachomius-great": "monastics",
  "shenoute-archimandrite": "monastics",
  "bishoy-great": "monastics",
  "saint-john-climacus": "monastics",
  "symeon-new-theologian": "monastics",
  "theodore-studite": "monastics",
  "mesrop-mashtots": "monastics",
  "paisios-athonite": "monastics",
  "silouan-athonite": "monastics",
  "nicodemus-hagiorite": "monastics",
  "seraphim-sarov": "monastics",
  "sergius-radonezh": "monastics",
  "mary-egypt": "monastics",
  "moses-black": "monastics",
  "macrina-younger": "monastics",
  "syncletica-alexandria": "monastics",
  "herman-alaska": "monastics",

  // Martyrs
  "saint-justin-martyr": "martyrs",
  "catherine": "martyrs",
  "george": "martyrs",
  "saint-panteleimon": "martyrs",
  "saint-demetrius-thessalonica": "martyrs",
  "saint-barbara": "martyrs",
  "saint-paraskeva-iconium": "martyrs",
  "menas-wonderworker": "martyrs",
  "mercurius-soldier": "martyrs",
  "hripsime-armenia": "martyrs",
  "margaret-marina": "martyrs",
  "anastasia-sirmium": "martyrs",

  // Holy Rulers
  "constantine-great": "rulers",
  "helena-equal-apostles": "rulers",
  "vladimir-kyiv": "rulers",
  "olga-kyiv": "rulers",

  // Righteous Laypeople
  "monica-hippo": "laypeople",
  "xenia-petersburg": "laypeople",
  "matrona-moscow": "laypeople",
};

export function getSaintCategoryId(saintId: string): SaintCategoryId | null {
  return SAINT_CATEGORY_BY_ID[saintId] ?? null;
}

export function filterSaintsByCategory<T extends { id: string }>(
  catalog: T[],
  categoryId: SaintCategoryId | null
): T[] {
  if (!categoryId) return catalog;
  return catalog.filter((saint) => SAINT_CATEGORY_BY_ID[saint.id] === categoryId);
}
