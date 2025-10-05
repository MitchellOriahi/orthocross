import { Bird } from "lucide-react";

interface DoveMascotProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export const DoveMascot = ({ size = "md", animated = false }: DoveMascotProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-40 h-40"
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 gradient-peaceful rounded-full blur-2xl opacity-40 animate-glow-pulse" />
        <Bird 
          className={`${sizeClasses[size]} relative z-10 text-primary drop-shadow-xl ${
            animated ? "animate-bounce" : ""
          }`}
          fill="currentColor"
        />
      </div>
    </div>
  );
};
