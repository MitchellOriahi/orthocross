import { describe, expect, it } from 'bun:test';
import { hasNoteAdditions, shouldDiscardDraft } from './emptyNote';

describe('untouched Journal notes', () => {
  it('discards a new note with no user additions', () => {
    expect(shouldDiscardDraft(true, false, { title: '', content: '<div><br></div>' })).toBe(true);
  });
  it('keeps a user-added title', () => {
    expect(shouldDiscardDraft(true, false, { title: 'My note', content: '' })).toBe(false);
  });
  it('keeps text and each supported media addition', () => {
    for (const content of ['<p>Hello</p>', '<img src="drawing.png">', '<audio src="voice.m4a">', '<video src="clip.mp4">']) {
      expect(hasNoteAdditions({ content })).toBe(true);
    }
    expect(hasNoteAdditions({ attachments: [{}] })).toBe(true);
    expect(hasNoteAdditions({ pinned_media_url: 'drawing.png' })).toBe(true);
  });
  it('keeps a note edited and subsequently emptied', () => {
    expect(shouldDiscardDraft(true, true, { title: '', content: '' })).toBe(false);
  });
  it('never discards an existing note retroactively', () => {
    expect(shouldDiscardDraft(false, false, { title: '', content: '' })).toBe(false);
  });
  it('does not treat empty editor markup as an addition', () => {
    expect(hasNoteAdditions({ content: '<p>&nbsp;<br></p>' })).toBe(false);
  });
});