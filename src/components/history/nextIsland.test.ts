import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { getNextIslandId } from './nextIsland';

const islands = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];

test('the first island glows on a new journey', () => {
  assert.equal(getNextIslandId(islands, []), 'first');
});

test('the glow advances after each completion', () => {
  const progress = [{ islandId: 'first', completed: true }];
  assert.equal(getNextIslandId(islands, progress), 'second');
  assert.equal(getNextIslandId(islands, [...progress, { islandId: 'second', completed: true }]), 'third');
});

test('only the earliest unfinished island is selected even with a gap in progress', () => {
  assert.equal(getNextIslandId(islands, [{ islandId: 'second', completed: true }]), 'first');
});

test('completed journeys have no glowing island', () => {
  assert.equal(getNextIslandId(islands, islands.map(island => ({ islandId: island.id, completed: true }))), undefined);
});

test('unfinished progress and unrelated journeys do not mark an island complete', () => {
  assert.equal(getNextIslandId(islands, [
    { islandId: 'first', completed: false },
    { islandId: 'other-journey', completed: true },
  ]), 'first');
});