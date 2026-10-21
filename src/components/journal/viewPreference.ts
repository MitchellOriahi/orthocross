export type JournalViewMode = 'list' | 'gallery';

export function isJournalViewMode(value: unknown): value is JournalViewMode {
  return value === 'list' || value === 'gallery';
}

export function resolveJournalView(saved: unknown, cached: unknown, current: JournalViewMode, changedSinceLoad: boolean): JournalViewMode {
  if (changedSinceLoad) return current;
  if (isJournalViewMode(cached)) return cached;
  return isJournalViewMode(saved) ? saved : current;
}

export const journalViewKey = (userId: string) => `orthocross:journal-view:${userId}`;