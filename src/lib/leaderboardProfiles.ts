type RankedUser = { user_id: string; total_points: number };
type PublicProfile = { id: string; username: string | null; display_name?: string | null; profile_picture_url: string | null };

/** Join public identities by account ID, never by result order or viewer friendship. */
export function attachLeaderboardProfiles(entries: RankedUser[], profiles: PublicProfile[]) {
  const byId = new Map(profiles.map(profile => [profile.id, profile]));
  return entries.map((entry, index) => {
    const profile = byId.get(entry.user_id);
    return {
      id: entry.user_id,
      username: profile?.username || profile?.display_name || "Unknown User",
      profile_picture_url: profile?.profile_picture_url || null,
      total_points: entry.total_points,
      rank: index + 1,
    };
  });
}