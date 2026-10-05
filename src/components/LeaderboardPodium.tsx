import { Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PodiumUser {
  id: string;
  username: string;
  profile_picture_url: string | null;
  books_completed: number;
}

export function LeaderboardPodium({ entries }: { entries: PodiumUser[] }) {
  return (
    <div className="leaderboard-podium" aria-label="Monthly leaderboard top three">
      {[1, 0, 2].map((index) => {
        const entry = entries[index];
        const place = index + 1;
        return (
          <div key={place} className={`podium-place podium-place-${place}`}>
            {entry && (
              <>
                <div className="podium-portrait">
                  {place === 1 && <Crown className="podium-crown" aria-label="First place" />}
                  <Avatar className="podium-avatar">
                    <AvatarImage src={entry.profile_picture_url || undefined} alt={`${entry.username}'s profile picture`} className="object-cover" />
                    <AvatarFallback className="bg-muted text-foreground">
                      {entry.username.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="podium-rank" aria-label={`Rank ${place}`}>{place}</span>
                </div>
                <span className="podium-username" title={entry.username}>{entry.username}</span>
                <div className="podium-step">
                  <span className="font-bold text-muted-foreground">{entry.books_completed} pts</span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}