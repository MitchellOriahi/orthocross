import { Flame } from "lucide-react";

interface StreakFlameProps {
  days: number;
  size?: "xs" | "sm" | "md" | "lg";
  hideLabel?: boolean;
}

export const StreakFlame = ({ days, size = "md", hideLabel = false }: StreakFlameProps) => {
  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32"
  };

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl"
  };

  // For xs size, use inline horizontal layout
  if (size === "xs") {
    return (
      <div className="inline-flex items-center gap-1">
        <Flame 
          className="w-4 h-4 dark:hidden"
          style={{ color: '#ff6b35' }}
          fill="url(#fireGradient)"
        />
        <Flame 
          className="w-4 h-4 hidden dark:block"
          style={{ color: '#3b82f6' }}
          fill="url(#blueFireGradient)"
        />
        <span className="text-xs font-medium text-muted-foreground">{days}</span>
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="fireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#f7931e" />
              <stop offset="100%" stopColor="#ff6b35" />
            </linearGradient>
            <linearGradient id="blueFireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center gap-2">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full blur-xl opacity-50 animate-glow-pulse dark:hidden" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffd700 100%)' }} />
        <div className="absolute inset-0 rounded-full blur-xl opacity-50 animate-glow-pulse hidden dark:block" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)' }} />
        <Flame 
          className={`${sizeClasses[size]} relative z-10 animate-flame-flicker drop-shadow-lg dark:hidden`}
          style={{ color: '#ff6b35' }}
          fill="url(#fireGradient)"
        />
        <Flame 
          className={`${sizeClasses[size]} relative z-10 animate-flame-flicker drop-shadow-lg hidden dark:block`}
          style={{ color: '#3b82f6' }}
          fill="url(#blueFireGradient)"
        />
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="fireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#f7931e" />
              <stop offset="100%" stopColor="#ff6b35" />
            </linearGradient>
            <linearGradient id="blueFireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">
          {days}
        </div>
        {!hideLabel && (
          <div className={`${textSizeClasses[size]} text-muted-foreground font-medium`}>
            day{days !== 1 ? 's' : ''} streak
          </div>
        )}
      </div>
    </div>
  );
};
