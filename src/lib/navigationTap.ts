export const NAVIGATION_TAP_SLOP = 12;

export type NavigationTap = {
  pointerId: number;
  x: number;
  y: number;
  path: string;
  cancelled: boolean;
};

export function trackNavigationMovement(tap: NavigationTap, x: number, y: number): NavigationTap {
  return {
    ...tap,
    cancelled: tap.cancelled || Math.abs(x - tap.x) > NAVIGATION_TAP_SLOP || Math.abs(y - tap.y) > NAVIGATION_TAP_SLOP,
  };
}

export function isNavigationTap(tap: NavigationTap | null, pointerId: number, path: string, x: number, y: number) {
  return Boolean(tap && tap.pointerId === pointerId && tap.path === path && !trackNavigationMovement(tap, x, y).cancelled);
}