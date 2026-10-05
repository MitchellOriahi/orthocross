interface NoteAdditions {
  title?: string | null;
  content?: string | null;
  attachments?: unknown[] | null;
  pinned_media_url?: string | null;
}

export function hasNoteAdditions(note: NoteAdditions): boolean {
  if (note.title?.trim() || note.attachments?.length || note.pinned_media_url) return true;
  const content = note.content || '';
  if (/<(?:img|audio|video|canvas)\b/i.test(content)) return true;
  return content.replace(/<[^>]*>/g, '').replace(/&(?:nbsp|#160|#xA0);/gi, ' ').trim().length > 0;
}

export function shouldDiscardDraft(isNew: boolean, wasModified: boolean, note: NoteAdditions): boolean {
  return isNew && !wasModified && !hasNoteAdditions(note);
}