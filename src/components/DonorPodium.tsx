import { Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DONOR_TIERS } from "@/config/donorTiers";

export interface DonorRow { rank: number; key: string; username: string; profile_picture_url: string | null; tierKey: string | null }
export function DonorTierButton({ donor, onSelect }: { donor: DonorRow; onSelect: (key: string) => void }) {
  const tier = DONOR_TIERS.find((t) => t.key === donor.tierKey);
  if (!tier) return null;
  return (
    <button
      type="button"
      onClick={() => onSelect(tier.key)}
      aria-label={`View all donator tiers: ${tier.name}`}
      className={`donor-tier-button donor-tier-${tier.key} inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none transition-colors`}
    >
      <span className="truncate">{tier.name}</span>
    </button>
  );
}
export function DonorPodium({ entries, onSelectTier }: { entries: DonorRow[]; onSelectTier: (key: string) => void }) {
  return (
    <div className="leaderboard-podium donor-podium" aria-label="Top three lifetime donators">
      {[1, 0, 2].map((index) => {
        const donor = entries[index];
        const place = index + 1;
        return (
          <div key={place} className={`podium-place podium-place-${place}`}>
            {donor && <>
              <div className="podium-portrait">
                {place === 1 && <Crown className="podium-crown" aria-label="First place" />}
                <Avatar className="podium-avatar">
                  <AvatarImage src={donor.profile_picture_url || undefined} alt={`${donor.username}'s profile picture`} className="object-cover" />
                  <AvatarFallback className="podium-avatar-fallback">{donor.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  <span className="podium-avatar-edge" aria-hidden="true" />
                </Avatar>
                <span className="podium-rank" aria-label={`Rank ${place}`}>{place}</span>
              </div>
              <span className="donor-podium-name font-semibold">{donor.username}</span>
              <div className="podium-step"><DonorTierButton donor={donor} onSelect={onSelectTier} /></div>
            </>}
          </div>
        );
      })}
    </div>
  );
}