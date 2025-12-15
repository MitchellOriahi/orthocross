import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GroupCrown } from "./GroupCrown";
import { cn } from "@/lib/utils";

interface GroupMemberBadgeProps {
  username: string;
  profilePictureUrl: string | null;
  rank: number | null;
  consecutiveCount: number;
  totalPoints: number;
  onClick?: () => void;
}

export const GroupMemberBadge = ({
  username,
  profilePictureUrl,
  rank,
  consecutiveCount,
  totalPoints,
  onClick
}: GroupMemberBadgeProps) => {
  const isTopThree = rank !== null && rank >= 1 && rank <= 3;
  
  const getNameTagStyles = () => {
    if (!isTopThree) return "bg-muted/50 text-foreground";
    
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]";
      case 2:
        return "bg-gradient-to-r from-slate-300/20 to-slate-400/20 text-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.3)]";
      case 3:
        return "bg-gradient-to-r from-amber-700/20 to-amber-800/20 text-amber-700 shadow-[0_0_12px_rgba(180,83,9,0.3)]";
      default:
        return "bg-muted/50 text-foreground";
    }
  };

  const getRankBgColor = () => {
    if (!isTopThree) return "bg-muted text-muted-foreground";
    
    switch (rank) {
      case 1:
        return "bg-amber-400/20 text-amber-400";
      case 2:
        return "bg-slate-300/20 text-slate-300";
      case 3:
        return "bg-amber-700/20 text-amber-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer hover:opacity-90",
        getNameTagStyles()
      )}
      onClick={onClick}
    >
      <div className={cn("w-8 h-8 flex items-center justify-center rounded-full font-bold", getRankBgColor())}>
        {rank || '-'}
      </div>
      <Avatar className="h-10 w-10">
        <AvatarImage src={profilePictureUrl || undefined} />
        <AvatarFallback>{username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-medium truncate">{username}</span>
        {isTopThree && (
          <GroupCrown rank={rank as 1 | 2 | 3} consecutiveCount={consecutiveCount} size="sm" />
        )}
      </div>
      <span className="text-sm opacity-80">
        {totalPoints} {totalPoints === 1 ? 'pt' : 'pts'}
      </span>
    </div>
  );
};
