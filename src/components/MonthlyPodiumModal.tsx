import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Trophy } from "lucide-react";

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

const WAIT_SECONDS = 3;
const TONE: Record<number, string> = { 1: "--podium-gold", 2: "--podium-silver", 3: "--podium-bronze" };

export const MonthlyPodiumModal = ({ isOpen, onClose, topThree, monthName }: MonthlyPodiumModalProps) => {
  const [secondsLeft, setSecondsLeft] = useState(WAIT_SECONDS);
  const canSkip = secondsLeft <= 0;

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(WAIT_SECONDS);
    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const byRank = (r: number) => topThree.find(w => w.rank === r);

  const PodiumWinner = ({ winner, rank, height }: { winner?: PodiumEntry; rank: number; height: string }) => {
    const tone = `var(${TONE[rank]})`;
    const isFirst = rank === 1;
    if (!winner) return <div className={`${height} w-[30%] max-w-32`} />;
    return (
      <div className="podium-winner-rise flex w-[30%] max-w-32 flex-col items-center gap-2" style={{ animationDelay: `${(rank - 1) * 160}ms` }}>
        <div className="relative">
          <Crown
            className={`podium-crown-float absolute drop-shadow ${isFirst ? "-top-8 h-8 w-8" : "-top-6 h-5 w-5"}`}
            style={{ color: `hsl(${tone})` }}
            fill="currentColor"
          />
          <Avatar
            className={isFirst ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16 sm:h-20 sm:w-20"}
            style={{ boxShadow: `0 0 0 3px hsl(${tone}), 0 0 18px 4px hsl(${tone} / 0.45)` }}
          >
            <AvatarImage src={winner.profile_picture_url || undefined} />
            <AvatarFallback className="text-lg font-bold">{winner.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div
            className="absolute -bottom-2 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full text-sm font-bold text-primary-foreground shadow-md"
            style={{ background: `hsl(${tone})` }}
          >
            {rank}
          </div>
        </div>
        <div className="mt-1 w-full text-center">
          <p className={`truncate font-semibold ${isFirst ? "text-base" : "text-sm"}`}>{winner.username}</p>
          <p className="text-xs text-muted-foreground">{winner.total_points} points</p>
        </div>
        <div
          className={`${height} relative w-full overflow-hidden rounded-t-2xl border border-b-0 flex items-start justify-center pt-3`}
          style={{
            borderColor: `hsl(${tone} / 0.6)`,
            background: `linear-gradient(to bottom, hsl(${tone} / 0.45), hsl(${tone} / 0.08))`,
            boxShadow: `inset 0 1px 0 hsl(${tone} / 0.8), 0 -6px 24px -8px hsl(${tone} / 0.6)`,
          }}
        >
          <span className="podium-step-shine" aria-hidden="true" />
          <Trophy className={isFirst ? "h-8 w-8" : "h-6 w-6"} style={{ color: `hsl(${tone})` }} fill="currentColor" />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={o => { if (!o && canSkip) onClose(); }}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-xl overflow-hidden rounded-3xl border-[hsl(var(--podium-gold)/0.4)] [&>button]:hidden"
        style={{ backgroundImage: "radial-gradient(ellipse at top, hsl(var(--podium-gold) / 0.18), transparent 60%)" }}
        onInteractOutside={e => !canSkip && e.preventDefault()}
        onEscapeKeyDown={e => !canSkip && e.preventDefault()}
      >
        <DialogTitle className="sr-only">Monthly Leaderboard Winners</DialogTitle>
        <div className="flex flex-col items-center space-y-6 px-1 py-4">
          <div className="space-y-1 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "hsl(var(--podium-gold))" }}>Monthly Champions</p>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{monthName}</h2>
            <p className="text-sm text-muted-foreground">Congratulations to our top performers!</p>
          </div>

          <div className="podium-stage-glow flex w-full items-end justify-center gap-2 pt-6 sm:gap-4">
            <PodiumWinner winner={byRank(2)} rank={2} height="h-24" />
            <PodiumWinner winner={byRank(1)} rank={1} height="h-36" />
            <PodiumWinner winner={byRank(3)} rank={3} height="h-16" />
          </div>

          <Button variant="sacred" size="lg" onClick={onClose} disabled={!canSkip} className="w-full max-w-md">
            {canSkip ? "Continue" : `Please wait ${secondsLeft}s...`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
