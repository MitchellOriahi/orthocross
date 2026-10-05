/** The glow follows the earliest unfinished island in the selected journey. */
export function getNextIslandId(
  islands: readonly { id: string }[],
  progress: readonly { islandId: string; completed: boolean }[],
): string | undefined {
  const completed = new Set(progress.filter(item => item.completed).map(item => item.islandId));
  return islands.find(island => !completed.has(island.id))?.id;
}