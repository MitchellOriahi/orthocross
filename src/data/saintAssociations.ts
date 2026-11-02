import { saintPageRoster, saintSortName } from "./saintPageRoster";

const byId = new Map(saintPageRoster.map(saint => [saint.id, saint]));

// Connections are recorded separately so the original lives remain untouched.
export const saintAssociationPairs: readonly (readonly [string, string])[] = [];

const associatedIds = new Map<string, Set<string>>();
for (const [left, right] of saintAssociationPairs) {
  if (left === right || !byId.has(left) || !byId.has(right)) continue;
  for (const [from, to] of [[left, right], [right, left]]) {
    const ids = associatedIds.get(from) ?? new Set<string>();
    ids.add(to);
    associatedIds.set(from, ids);
  }
}

export function getAssociatedSaints(saintId: string) {
  return [...(associatedIds.get(saintId) ?? [])]
    .flatMap(id => { const saint = byId.get(id); return saint ? [saint] : []; })
    .sort((a, b) => saintSortName(a.name).localeCompare(saintSortName(b.name), "en"));
}