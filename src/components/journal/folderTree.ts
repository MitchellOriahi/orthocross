export interface TreeFolder {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
}

export function folderSiblings<T extends TreeFolder>(folders: T[], parentId: string | null): T[] {
  return folders.filter(f => f.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

export function reorderedSiblings<T extends TreeFolder>(folders: T[], id: string, direction: -1 | 1): T[] {
  const folder = folders.find(f => f.id === id);
  if (!folder) return [];
  const siblings = folderSiblings(folders, folder.parent_id);
  const index = siblings.findIndex(f => f.id === id);
  const other = index + direction;
  if (other < 0 || other >= siblings.length) return siblings;
  [siblings[index], siblings[other]] = [siblings[other], siblings[index]];
  return siblings.map((f, sort_order) => ({ ...f, sort_order }));
}

export function folderPath(folders: { id: string; name: string; parent_id?: string | null }[], id: string): string {
  const parts: string[] = [];
  const seen = new Set<string>();
  let current: string | null = id;
  while (current && !seen.has(current)) {
    seen.add(current);
    const folder = folders.find(f => f.id === current);
    if (!folder) break;
    parts.unshift(folder.name);
    current = folder.parent_id ?? null;
  }
  return parts.join(' / ');
}