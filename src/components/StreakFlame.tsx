import { Flame } from "lucide-react";

interface StreakFlameProps {
  days: number;
  size?: "sm" | "md" | "lg";
}

export const StreakFlame = ({ days, size = "md" }: StreakFlameProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl"
  };

  return (
    <div className="relative inline-flex flex-col items-center gap-2">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 gradient-sacred rounded-full blur-xl opacity-50 animate-glow-pulse" />
        <Flame 
          className={`${sizeClasses[size]} relative z-10 text-primary animate-flame-flicker drop-shadow-lg`}
          fill="currentColor"
        />
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold gradient-sacred bg-clip-text text-transparent">
          {days}
        </div>
        <div className={`${textSizeClasses[size]} text-muted-foreground font-medium`}>
          day{days !== 1 ? 's' : ''} streak
        </div>
      </div>
    </div>
  );
};
