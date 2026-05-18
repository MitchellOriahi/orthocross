import { Button } from "@/components/ui/button";
import { MascotCompanion } from "@/components/MascotCompanion";

interface CelebrationOverlayProps {
  open: boolean;
  title: string;
  message: string;
  xp?: number;
  onClose: () => void;
}

export const CelebrationOverlay = ({ open, title, message, xp = 25, onClose }: CelebrationOverlayProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            className="confetti-piece"
            style={{
              left: `${8 + ((index * 47) % 84)}%`,
              animationDelay: `${index * 70}ms`,
              animationDuration: `${1.8 + (index % 5) * 0.18}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-sm rounded-[2rem] border border-border/70 bg-card p-6 text-center shadow-elevated animate-celebration-card">
        <div className="mb-5 flex justify-center">
          <MascotCompanion mood="cheering" size="lg" compact />
        </div>
        <div className="mx-auto mb-3 w-fit rounded-full bg-primary px-4 py-1 text-sm font-black text-primary-foreground shadow-lg animate-reward-pop">
          +{xp} XP
        </div>
        <h2 className="text-2xl font-black tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button className="mt-6 w-full rounded-2xl font-bold active:scale-95" onClick={onClose}>
          Keep going
        </Button>
      </div>
    </div>
  );
};
