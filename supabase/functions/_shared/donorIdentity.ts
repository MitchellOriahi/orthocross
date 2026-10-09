import { DONOR_TEXT } from "./donorTiers.ts";
interface DonorProfile {
  display_name?: string | null;
  username?: string | null;
  profile_picture_url?: string | null;
  donor_anonymous?: boolean | null;
}
export function publicDonorIdentity(profile: DonorProfile | undefined) {
  if (!profile || profile.donor_anonymous) return { username: DONOR_TEXT.anonymousName, profile_picture_url: null };
  return {
    username: profile.display_name?.trim() || profile.username?.trim() || DONOR_TEXT.anonymousName,
    profile_picture_url: profile.profile_picture_url ?? null,
  };
}