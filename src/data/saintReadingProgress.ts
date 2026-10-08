import { saintPageRoster } from "./saintPageRoster";

const storyIds = new Set(saintPageRoster.map(saint => saint.id));

export function completedSaintIds(reads: { saint_id: string }[]): Set<string> {
  return new Set(reads.map(read => read.saint_id).filter(id => storyIds.has(id)));
}

export function allSaintStoriesCompleted(completed: ReadonlySet<string>): boolean {
  return storyIds.size > 0 && [...storyIds].every(id => completed.has(id));
}

export function earnsAllSaintsAward(before: ReadonlySet<string>, after: ReadonlySet<string>): boolean {
  return !allSaintStoriesCompleted(before) && allSaintStoriesCompleted(after);
}