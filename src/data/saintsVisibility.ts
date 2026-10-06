// Temporary presentation pause. Never delete or edit the saved catalog to hide it.
export const SAINTS_VISIBLE = false;

export function getVisibleSaints<T>(catalog: T[], visible = SAINTS_VISIBLE): T[] {
  return visible ? catalog : [];
}