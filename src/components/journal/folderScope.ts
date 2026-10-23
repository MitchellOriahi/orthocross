export const ALL_NOTES = '__all_notes__';
export const DEFAULT_NOTES_FOLDER_NAME = 'Notes';

export interface DefaultFlag {
  is_default?: boolean | null;
}

export function isDefaultNotesFolder(folder: DefaultFlag): boolean {
  return folder.is_default === true;
}

export function defaultNotesFolder<T extends DefaultFlag>(folders: T[]): T | undefined {
  return folders.find(isDefaultNotesFolder);
}

export function needsDefaultNotesFolder(folders: DefaultFlag[]): boolean {
  return !folders.some(isDefaultNotesFolder);
}

export function foldersExcludingDefault<T extends DefaultFlag>(folders: T[]): T[] {
  return folders.filter(folder => !isDefaultNotesFolder(folder));
}

export function notesInFolder<T extends { folder_id: string | null }>(notes: T[], folderId: string | null): T[] {
  const scope = folderId === ALL_NOTES ? null : folderId;
  return notes.filter(note => note.folder_id === scope);
}

export function newNoteFolder(folderId: string | null): string | null {
  return folderId === ALL_NOTES ? null : folderId;
}

export function selectionAfterExit(destination: 'notes' | 'folders' | 'home', folderId: string | null) {
  return { noteId: null, folderId: destination === 'notes' ? folderId : null };
}
