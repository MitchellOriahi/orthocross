import { describe, expect, it } from 'bun:test';
import { ALL_NOTES, notesInFolder, newNoteFolder, selectionAfterExit } from './folderScope';

const notes = [{ id: 'general', folder_id: null }, { id: 'prayer', folder_id: 'prayers' }, { id: 'study', folder_id: 'study' }];
describe('Journal folder separation', () => {
  it('leaving a folder clears both selections', () => {
    expect(selectionAfterExit('folders', 'prayers')).toEqual({ noteId: null, folderId: null });
  });
  it('leaving a note clears its selection while retaining its folder', () => {
    expect(selectionAfterExit('notes', 'prayers')).toEqual({ noteId: null, folderId: 'prayers' });
  });
  it('returning home clears both selections', () => {
    expect(selectionAfterExit('home', 'prayers')).toEqual({ noteId: null, folderId: null });
  });
  it('general notes exclude notes in named folders', () => {
    expect(notesInFolder(notes, null).map(n => n.id)).toEqual(['general']);
  });
  it('a named folder contains only its own notes', () => {
    expect(notesInFolder(notes, 'prayers').map(n => n.id)).toEqual(['prayer']);
  });
  it('new notes belong to the folder being viewed', () => {
    expect(newNoteFolder('prayers')).toBe('prayers');
    expect(newNoteFolder(null)).toBe(null);
    expect(newNoteFolder(ALL_NOTES)).toBe(null);
  });
  it('All Notes contains only unfiled notes', () => {
    expect(notesInFolder(notes, ALL_NOTES).map(n => n.id)).toEqual(['general']);
  });
  it('moving from All Notes removes the note and includes it in the chosen folder', () => {
    const moved = notes.map(n => n.id === 'general' ? { ...n, folder_id: 'prayers' } : n);
    expect(notesInFolder(moved, ALL_NOTES)).toEqual([]);
    expect(notesInFolder(moved, 'prayers').map(n => n.id)).toEqual(['general', 'prayer']);
  });
  it('moving a note removes it from general notes and adds it to its destination', () => {
    const moved = notes.map(n => n.id === 'general' ? { ...n, folder_id: 'prayers' } : n);
    expect(notesInFolder(moved, null)).toEqual([]);
    expect(notesInFolder(moved, 'prayers').map(n => n.id)).toEqual(['general', 'prayer']);
  });
});