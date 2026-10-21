export const ALL_NOTES = '__all_notes__';

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