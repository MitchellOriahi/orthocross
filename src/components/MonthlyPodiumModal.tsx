import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

interface PodiumEntry {
  id: string;
  username: string;
  profile_picture_url: string | null;
  total_points: number;
  rank: number;
}

interface MonthlyPodiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  topThree: PodiumEntry[];
  monthName: string;
}

export const MonthlyPodiumModal = ({
  isOpen,
  onClose,
  topThree,
  monthName,
}: MonthlyPodiumModalProps) => {
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCanSkip(false);
      const timer = setTimeout(() => {
        setCanSkip(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const first = topThree.find(w => w.rank === 1);
  const second = topThree.find(w => w.rank === 2);
  const third = topThree.find(w => w.rank === 3);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-amber-400";
    if (rank === 2) return "text-slate-300";
    return "text-amber-700";
  };

  const PodiumWinner = ({ winner, rank, height }: { winner?: PodiumEntry; rank: number; height: string }) => {
    if (!winner) return <div className={`${height} w-20 sm:w-24 md:w-32`} />;
    
    const isFirst = rank === 1;
    const avatarSize = isFirst ? "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28" : "h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20";
    
    return (
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <div className="relative">
          <Avatar className={`${avatarSize} border-4 border-background shadow-xl`}>
            <AvatarImage src={winner.profile_picture_url || undefined} />
            <AvatarFallback className="text-xl sm:text-2xl font-bold">
              {winner.username?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -top-2 -right-2 ${getMedalColor(rank)} bg-background rounded-full p-1.5 sm:p-2 shadow-lg`}>
            <Trophy className={isFirst ? "h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" : "h-5 w-5 sm:h-6 sm:w-6"} fill="currentColor" />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center font-bold text-base sm:text-lg shadow-md">
            {rank}
          </div>
        </div>
        <div className="text-center">
          <p className={`font-bold ${isFirst ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-base'} truncate max-w-[80px] sm:max-w-[100px] md:max-w-none`}>{winner.username}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">{winner.total_points} points</p>
        </div>
        <div className={`${height} w-20 sm:w-24 md:w-32 bg-gradient-to-t from-primary/20 to-primary/5 rounded-t-lg border-t-4 border-primary/30 flex items-end justify-center pb-2 sm:pb-3 md:pb-4`}>
          <span className={`font-bold ${isFirst ? 'text-4xl sm:text-5xl md:text-6xl' : 'text-2xl sm:text-3xl md:text-4xl'} text-primary/20`}>{rank}</span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={canSkip ? onClose : undefined}>
      <DialogContent 
        className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl [&>button]:hidden"
        onInteractOutside={(e) => !canSkip && e.preventDefault()}
        onEscapeKeyDown={(e) => !canSkip && e.preventDefault()}
      >
        <DialogTitle className="sr-only">Monthly Leaderboard Winners</DialogTitle>
        <div className="flex flex-col items-center justify-center py-4 sm:py-6 md:py-8 px-2 sm:px-4 space-y-4 sm:space-y-6 md:space-y-8">
          <div className="text-center space-y-1 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground flex items-center justify-center gap-2 sm:gap-3">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-yellow-500" fill="currentColor" />
              {monthName} Winners
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-yellow-500" fill="currentColor" />
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
              Congratulations to our top performers!
            </p>
          </div>

          <div className="flex items-end justify-center gap-3 sm:gap-5 md:gap-8 w-full px-2">
            {/* Second Place - Left */}
            <PodiumWinner winner={second} rank={2} height="h-32 sm:h-36 md:h-40" />
            
            {/* First Place - Center (tallest) */}
            <PodiumWinner winner={first} rank={1} height="h-44 sm:h-50 md:h-56" />
            
            {/* Third Place - Right */}
            <PodiumWinner winner={third} rank={3} height="h-24 sm:h-28 md:h-32" />
          </div>

          <Button 
            variant="sacred" 
            size="lg" 
            onClick={onClose}
            disabled={!canSkip}
            className="w-full max-w-md"
          >
            {canSkip ? "Continue" : "Please wait 3s..."}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
