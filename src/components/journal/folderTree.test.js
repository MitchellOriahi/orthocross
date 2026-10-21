import { describe, expect, it } from 'bun:test';
import { folderSiblings, reorderedSiblings, folderPath } from './folderTree';

const folders = [
  { id: 'b', name: 'Beta', parent_id: null, sort_order: 0 },
  { id: 'a', name: 'Alpha', parent_id: null, sort_order: 1 },
  { id: 'child', name: 'Child', parent_id: 'a', sort_order: 0 },
  { id: 'child2', name: 'Second', parent_id: 'a', sort_order: 1 },
  { id: 'deep', name: 'Deep', parent_id: 'child', sort_order: 0 },
];
describe('Journal nested folders', () => {
  it('roots exclude nested folders and preserve manual order', () => {
    expect(folderSiblings(folders, null).map(f => f.id)).toEqual(['b', 'a']);
  });
  it('revealing a parent returns only its direct children', () => {
    expect(folderSiblings(folders, 'a').map(f => f.id)).toEqual(['child', 'child2']);
  });
  it('reordering children does not include roots or deeper folders', () => {
    expect(reorderedSiblings(folders, 'child2', -1).map(f => [f.id, f.sort_order])).toEqual([['child2', 0], ['child', 1]]);
    expect(folders[0].sort_order).toBe(0);
  });
  it('moving a root up produces saved sibling positions', () => {
    expect(reorderedSiblings(folders, 'a', -1).map(f => [f.id, f.sort_order])).toEqual([['a', 0], ['b', 1]]);
  });
  it('cannot move beyond either end', () => {
    expect(reorderedSiblings(folders, 'b', -1).map(f => f.id)).toEqual(['b', 'a']);
    expect(reorderedSiblings(folders, 'a', 1).map(f => f.id)).toEqual(['b', 'a']);
  });
  it('move destinations identify nested folders by their full path', () => {
    expect(folderPath(folders, 'deep')).toBe('Alpha / Child / Deep');
  });
});