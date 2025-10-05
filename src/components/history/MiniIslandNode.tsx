import { Circle, CheckCircle2, Lock, Book, Dumbbell, Users, Calendar, MapPin, Zap, Gift } from "lucide-react";
import { MiniIsland } from "@/data/historyContent";
import { cn } from "@/lib/utils";

interface MiniIslandNodeProps {
  miniIsland: MiniIsland;
  offsetX: number;
  onClick: () => void;
  isUnlocked: boolean;
}

const iconMap = {
  book: Book,
  dumbbell: Dumbbell,
  users: Users,
  calendar: Calendar,
  map: MapPin,
  check: CheckCircle2,
  chest: Gift,
  lightning: Zap,
};

export const MiniIslandNode = ({ miniIsland, offsetX, onClick, isUnlocked }: MiniIslandNodeProps) => {
  const IconComponent = iconMap[miniIsland.icon as keyof typeof iconMap] || Circle;
  const isComplete = miniIsland.state === "complete";
  const isAvailable = miniIsland.state === "available";

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer group"
      style={{ transform: `translate(calc(-50% + ${offsetX}px), -50%)` }}
      onClick={() => isUnlocked && onClick()}
    >
      {/* Node Circle */}
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-4",
          isComplete && "bg-primary border-primary shadow-lg shadow-primary/50",
          isAvailable && "bg-card border-primary animate-pulse",
          !isUnlocked && !isComplete && "bg-muted border-muted-foreground/30 opacity-60",
          isUnlocked && !isComplete && !isAvailable && "bg-card border-primary/50",
          isUnlocked && "group-hover:scale-110"
        )}
      >
        {isComplete ? (
          <CheckCircle2 className="w-6 h-6 text-primary-foreground" strokeWidth={3} />
        ) : !isUnlocked ? (
          <Lock className="w-5 h-5 text-muted-foreground" />
        ) : (
          <IconComponent className="w-5 h-5 text-primary" />
        )}
      </div>

      {/* Title Label */}
      <div
        className={cn(
          "mt-2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-all",
          isComplete && "bg-primary/20 text-primary",
          isAvailable && "bg-primary/30 text-primary",
          !isUnlocked && "bg-muted text-muted-foreground opacity-60"
        )}
      >
        {miniIsland.title}
      </div>

      {/* XP Badge */}
      {miniIsland.rewards.xp > 0 && (
        <div className="mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
          +{miniIsland.rewards.xp} XP
        </div>
      )}
    </div>
  );
};
