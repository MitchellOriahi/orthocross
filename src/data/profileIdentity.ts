import roster from "./saintPageRoster.json";

export type BranchTradition = "oriental" | "eastern" | "unaffiliated";
export type IdentityOption = { value: string; label: string; group?: string };

export const ORTHODOX_BRANCHES: (IdentityOption & { tradition: BranchTradition })[] = [
  ...["Coptic", "Ethiopian Tewahedo", "Eritrean Tewahedo", "Armenian Apostolic", "Syriac Orthodox", "Malankara Orthodox", "Jacobite Syrian Orthodox", "Oriental Orthodox"].map(label => ({ value: label, label, group: "Oriental Orthodox", tradition: "oriental" as const })),
  ...["Greek Orthodox", "Russian Orthodox", "Antiochian Orthodox", "Serbian Orthodox", "Romanian Orthodox", "Bulgarian Orthodox", "Georgian Orthodox", "Cypriot Orthodox", "Polish Orthodox", "Albanian Orthodox", "Orthodox Church in America", "Ukrainian Orthodox", "Macedonian Orthodox", "Czech and Slovak Orthodox", "Finnish Orthodox", "Japanese Orthodox", "Eastern Orthodox"].map(label => ({ value: label, label, group: "Eastern Orthodox", tradition: "eastern" as const })),
  ...["Inquirer", "Catechumen", "Exploring Orthodoxy", "Prefer not to say"].map(label => ({ value: label, label, group: "Other", tradition: "unaffiliated" as const })),
];

export function getBranchTradition(branch: string | null | undefined): BranchTradition {
  return ORTHODOX_BRANCHES.find(option => option.value === branch)?.tradition ?? "unaffiliated";
}

const collectiveOrders = new Set(["seraphim", "cherubim", "thrones", "dominions", "virtues", "powers", "principalities", "angels"]);
export const PATRON_SAINT_OPTIONS: IdentityOption[] = roster
  .filter(saint => !collectiveOrders.has(saint.id))
  .map(saint => ({ value: saint.id, label: [saint.prefix, saint.name].filter(Boolean).join(" ") }))
  .sort((a, b) => a.label.replace(/^St\.\s+/, "").localeCompare(b.label.replace(/^St\.\s+/, "")));