/** Presentation only; the database independently enforces group ownership. */
export function canDeleteCreatedGroup(
  userId: string | undefined,
  group: { created_by: string } | null,
): boolean {
  return Boolean(userId && group && group.created_by === userId);
}