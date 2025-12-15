import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupCrownProps {
  rank: 1 | 2 | 3;
  consecutiveCount: number;
  size?: 'sm' | 'md' | 'lg';
}

export const GroupCrown = ({ rank, consecutiveCount, size = 'md' }: GroupCrownProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const colorClasses = {
    1: 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]',
    2: 'text-slate-300 drop-shadow-[0_0_4px_rgba(203,213,225,0.6)]',
    3: 'text-amber-700 drop-shadow-[0_0_4px_rgba(180,83,9,0.6)]'
  };

  const textSizeClasses = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <Crown className={cn(sizeClasses[size], colorClasses[rank])} />
      {consecutiveCount > 1 && (
        <span 
          className={cn(
            "absolute -top-1 -right-1 font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center",
            textSizeClasses[size],
            rank === 1 && "bg-amber-400 text-amber-950",
            rank === 2 && "bg-slate-300 text-slate-800",
            rank === 3 && "bg-amber-700 text-amber-100"
          )}
        >
          {consecutiveCount}
        </span>
      )}
    </div>
  );
};
