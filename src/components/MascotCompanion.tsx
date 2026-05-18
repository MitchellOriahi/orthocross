import { Bird, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type MascotMood = "idle" | "happy" | "cheering" | "thinking" | "encouraging";

interface MascotCompanionProps {
  mood?: MascotMood;
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  compact?: boolean;
}

const moodStyles: Record<MascotMood, { ring: string; body: string; animation: string; label: string }> = {
  idle: {
    ring: "from-primary/15 via-primary/5 to-transparent",
    body: "text-primary",
    animation: "animate-mascot-float",
    label: "Ready when you are",
  },
  happy: {
    ring: "from-emerald-400/25 via-primary/10 to-transparent",
    body: "text-emerald-600 dark:text-emerald-300",
    animation: "animate-mascot-bob",
    label: "Nice progress",
  },
  cheering: {
    ring: "from-amber-300/40 via-orange-300/20 to-transparent",
    body: "text-amber-600 dark:text-amber-300",
    animation: "animate-mascot-cheer",
    label: "Celebrate the win",
  },
  thinking: {
    ring: "from-sky-300/30 via-primary/10 to-transparent",
    body: "text-sky-600 dark:text-sky-300",
    animation: "animate-mascot-think",
    label: "Choose a chapter",
  },
  encouraging: {
    ring: "from-purple-300/30 via-primary/10 to-transparent",
    body: "text-purple-600 dark:text-purple-300",
    animation: "animate-mascot-float",
    label: "Keep going",
  },
};

const sizeClasses = {
  sm: "h-14 w-14",
  md: "h-20 w-20",
  lg: "h-28 w-28",
};

const iconSizes = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export const MascotCompanion = ({
  mood = "idle",
  message,
  size = "md",
  className,
  compact = false,
}: MascotCompanionProps) => {
  const style = moodStyles[mood];

  return (
    <div className={cn("relative flex items-center gap-3", className)} aria-label={style.label}>
      <div className={cn("relative shrink-0", sizeClasses[size])}>
        <div className={cn("absolute -inset-3 rounded-full bg-gradient-to-br blur-xl", style.ring)} />
        <div className="absolute -right-1 -top-1 z-20 rounded-full bg-background/90 p-1 shadow-lg animate-reward-pop">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        </div>
        <div className={cn(
          "relative z-10 grid h-full w-full place-items-center rounded-[2rem] border border-border/70 bg-card/90 shadow-elevated backdrop-blur",
          style.animation
        )}>
          <Bird className={cn(iconSizes[size], style.body)} fill="currentColor" />
          <span className="absolute -bottom-1 left-1/2 h-2 w-10 -translate-x-1/2 rounded-full bg-foreground/10 blur-sm" />
        </div>
      </div>

      {!compact && message && (
        <div className="mascot-bubble max-w-[240px] rounded-2xl border border-border/70 bg-card/95 px-4 py-3 text-sm font-medium shadow-elevated backdrop-blur">
          {message}
        </div>
      )}
    </div>
  );
};
