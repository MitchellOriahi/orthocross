import type { SaintDetail } from "./saintTypes";

export function mergeSaintCatalog(original: SaintDetail[], additional: SaintDetail[]): SaintDetail[] {
  return [...original, ...additional].sort((a, b) =>
    `${a.name} ${a.epithet}`.localeCompare(`${b.name} ${b.epithet}`, "en")
  );
}