export const ALL_NOTES = '__all_notes__';

export function notesInFolder<T extends { folder_id: string | null }>(notes: T[], folderId: string | null): T[] {
  return folderId === ALL_NOTES ? notes : notes.filter(note => note.folder_id === folderId);
}

export function newNoteFolder(folderId: string | null): string | null {
  return folderId === ALL_NOTES ? null : folderId;
}