import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { shouldSwipeBack, SWIPE_BACK_MIN_DISTANCE, SWIPE_BACK_MAX_DRIFT } from './swipeBack';

test('a clear rightward swipe goes back', () => {
  assert.equal(shouldSwipeBack({ x: 20, y: 300 }, { x: 150, y: 310 }), true);
});

test('a short swipe does not go back', () => {
  assert.equal(shouldSwipeBack({ x: 20, y: 300 }, { x: 20 + SWIPE_BACK_MIN_DISTANCE, y: 300 }), false);
});

test('a vertical scroll does not go back', () => {
  assert.equal(shouldSwipeBack({ x: 20, y: 300 }, { x: 40, y: 300 + SWIPE_BACK_MAX_DRIFT }), false);
  assert.equal(shouldSwipeBack({ x: 20, y: 300 }, { x: 40, y: 300 - SWIPE_BACK_MAX_DRIFT }), false);
});

test('a leftward swipe does not go back', () => {
  assert.equal(shouldSwipeBack({ x: 150, y: 300 }, { x: 20, y: 300 }), false);
});

test('a diagonal swipe that is mostly horizontal goes back', () => {
  assert.equal(shouldSwipeBack({ x: 20, y: 300 }, { x: 160, y: 340 }), true);
});

test('a diagonal swipe that is mostly vertical does not go back', () => {
  assert.equal(shouldSwipeBack({ x: 20, y: 300 }, { x: 110, y: 380 }), false);
});

test('missing start or end never goes back', () => {
  assert.equal(shouldSwipeBack(null, { x: 150, y: 300 }), false);
  assert.equal(shouldSwipeBack({ x: 20, y: 300 }, null), false);
});
