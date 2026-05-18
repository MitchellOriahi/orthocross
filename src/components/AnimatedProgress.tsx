import { Sparkles } from "lucide-react";

interface AnimatedProgressProps {
  value: number;
  label?: string;
  showSpark?: boolean;
  className?: string;
}

export const AnimatedProgress = ({ value, label, showSpark = true, className = "" }: AnimatedProgressProps) => {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <div className="text-xs font-medium text-muted-foreground">{label}</div>}
      <div className="relative h-3 overflow-hidden rounded-full bg-muted shadow-inner">
        <div
          className="animated-progress-fill h-full rounded-full"
          style={{ width: `${safeValue}%` }}
        >
          {showSpark && safeValue > 0 && (
            <span className="absolute right-0 top-1/2 grid h-5 w-5 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full bg-background shadow-md animate-reward-pop">
              <Sparkles className="h-3 w-3 text-amber-500" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
