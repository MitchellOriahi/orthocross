export interface SwipePoint {
  x: number;
  y: number;
}

// Rightward swipe must travel at least this far to count as "go back".
export const SWIPE_BACK_MIN_DISTANCE = 90;
// Vertical drift beyond this means the user was scrolling, not swiping back.
export const SWIPE_BACK_MAX_DRIFT = 70;

export function shouldSwipeBack(start: SwipePoint | null, end: SwipePoint | null): boolean {
  if (!start || !end) return false;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx <= SWIPE_BACK_MIN_DISTANCE) return false;
  if (Math.abs(dy) >= SWIPE_BACK_MAX_DRIFT) return false;
  return dx > Math.abs(dy) * 1.2;
}
