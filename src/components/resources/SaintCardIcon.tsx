import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SaintCardIcon as Icon } from "@/data/saintCardIcons";
import { resolveSaintCardIcon, useSaintIconOverrides } from "@/hooks/useSaintIconOverrides";
import { useSaintReadingProgress } from "@/hooks/useSaintReadingProgress";

export function SaintIconCircle({ icon, className }: { icon: Icon | null; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const show = icon && icon.image_url !== failedUrl;
  return (
    <span className={cn("relative block h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-2 border-[hsl(var(--saint-icon-border))]", show ? "bg-[hsl(var(--saint-icon-gold))]" : "bg-muted", className)}>
      {show ? (
        <img
          src={icon.image_url}
          alt=""
          decoding="async"
          draggable={false}
          onError={() => setFailedUrl(icon.image_url)}
          className="saint-card-icon-img h-full w-full object-cover"
          style={{ objectPosition: `${icon.focus_x}% ${icon.focus_y}%`, transform: `scale(${icon.zoom})`, transformOrigin: `${icon.focus_x}% ${icon.focus_y}%` }}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
          <svg aria-hidden="true" viewBox="0 0 32 44" className="h-[45%] w-[35%]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 3v38M10 10h12M4 18h24M9 29l14 7" /></svg>
        </span>
      )}
    </span>
  );
}

export function SaintCardIcon({ saintId, fallbackUrl, className }: { saintId: string; fallbackUrl?: string; className?: string }) {
  const { data } = useSaintIconOverrides();
  const { completed } = useSaintReadingProgress();
  const icon = resolveSaintCardIcon(saintId, fallbackUrl, data);
  return <SaintIconCircle key={icon?.image_url ?? "none"} icon={icon} className={cn(className, completed.has(saintId) && "saint-story-completed")} />;
}
