import { describe, expect, it } from 'bun:test';
import { resolveJournalView, journalViewKey } from './viewPreference';

describe('persistent Journal view', () => {
  it('does not replace a manually chosen gallery with a late saved list read', () => {
    expect(resolveJournalView('list', null, 'gallery', true)).toBe('gallery');
  });
  it('does not replace a manually chosen list with a late gallery read', () => {
    expect(resolveJournalView('gallery', null, 'list', true)).toBe('list');
  });
  it('keeps a cached explicit choice across remounts even when remote saving is delayed', () => {
    expect(resolveJournalView('list', 'gallery', 'list', false)).toBe('gallery');
  });
  it('restores the account preference on a device without a cached choice', () => {
    expect(resolveJournalView('gallery', null, 'list', false)).toBe('gallery');
  });
  it('isolates choices by account', () => {
    expect(journalViewKey('account-a')).not.toBe(journalViewKey('account-b'));
  });
});