import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  monthName
}: MonthlyPodiumModalProps) => {
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCanSkip(false);
      const timer = setTimeout(() => setCanSkip(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (canSkip) {
      onClose();
    }
  };

  // Arrange podium: #2 left, #1 middle, #3 right
  const first = topThree.find(entry => entry.rank === 1);
  const second = topThree.find(entry => entry.rank === 2);
  const third = topThree.find(entry => entry.rank === 3);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl [&>button]:hidden"
        onInteractOutside={(e) => !canSkip && e.preventDefault()}
        onEscapeKeyDown={(e) => !canSkip && e.preventDefault()}
      >
        <div className="flex flex-col items-center justify-center py-8 px-4 space-y-8">
          <div className="text-center space-y-2">
            <Trophy className="w-16 h-16 mx-auto text-primary animate-bounce" />
            <h2 className="text-3xl font-bold">Top Performers</h2>
            <p className="text-lg text-muted-foreground">{monthName}</p>
          </div>

          {/* Podium */}
          <div className="flex items-end justify-center gap-4 w-full max-w-xl">
            {/* Second Place - Left */}
            {second && (
              <div className="flex flex-col items-center flex-1">
                <Avatar className="w-20 h-20 mb-2 ring-4 ring-slate-400">
                  <AvatarImage src={second.profile_picture_url || undefined} />
                  <AvatarFallback>{second.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-sm mb-2">{second.username}</p>
                <div className="w-full bg-slate-400 rounded-t-lg flex flex-col items-center justify-end h-32 pb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center text-xl font-bold mb-2">
                    2
                  </div>
                  <p className="text-sm text-white font-bold">{second.total_points} pts</p>
                </div>
              </div>
            )}

            {/* First Place - Middle */}
            {first && (
              <div className="flex flex-col items-center flex-1">
                <Avatar className="w-28 h-28 mb-2 ring-4 ring-primary">
                  <AvatarImage src={first.profile_picture_url || undefined} />
                  <AvatarFallback>{first.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="font-semibold mb-2">{first.username}</p>
                <div className="w-full bg-primary rounded-t-lg flex flex-col items-center justify-end h-48 pb-4">
                  <div className="w-16 h-16 rounded-full bg-primary-foreground flex items-center justify-center text-2xl font-bold mb-2">
                    1
                  </div>
                  <p className="text-sm text-primary-foreground font-bold">{first.total_points} pts</p>
                </div>
              </div>
            )}

            {/* Third Place - Right */}
            {third && (
              <div className="flex flex-col items-center flex-1">
                <Avatar className="w-20 h-20 mb-2 ring-4 ring-amber-600">
                  <AvatarImage src={third.profile_picture_url || undefined} />
                  <AvatarFallback>{third.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-sm mb-2">{third.username}</p>
                <div className="w-full bg-amber-600 rounded-t-lg flex flex-col items-center justify-end h-24 pb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-xl font-bold mb-2">
                    3
                  </div>
                  <p className="text-sm text-white font-bold">{third.total_points} pts</p>
                </div>
              </div>
            )}
          </div>

          {/* Skip Button */}
          <Button 
            onClick={onClose}
            disabled={!canSkip}
            className="w-full max-w-xs"
          >
            {canSkip ? "Continue" : `Wait ${3}s...`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
