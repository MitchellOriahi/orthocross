// deno-lint-ignore-file no-explicit-any
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_RE.test(value);

export async function areFriends(admin: any, a: string, b: string): Promise<boolean> {
  const { data } = await admin.from("friends").select("id")
    .or(`and(user_id.eq.${a},friend_id.eq.${b}),and(user_id.eq.${b},friend_id.eq.${a})`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function shareGroup(admin: any, a: string, b: string): Promise<boolean> {
  const { data: mine } = await admin.from("group_members").select("group_id").eq("user_id", a);
  const ids = (mine ?? []).map((r: { group_id: string }) => r.group_id);
  if (!ids.length) return false;
  const { data: shared } = await admin.from("group_members").select("id")
    .eq("user_id", b).in("group_id", ids).limit(1);
  return (shared?.length ?? 0) > 0;
}

// Friends (either direction) or members of a common group.
export async function areConnected(admin: any, a: string, b: string): Promise<boolean> {
  return (await areFriends(admin, a, b)) || (await shareGroup(admin, a, b));
}
