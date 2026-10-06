import { useState } from "react";
import { Cross } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAINT_DISPLAY_ICONS } from "@/data/saintDisplayIcons";

export function SaintPortrait({ saintId, circular = false, className }: { saintId: string; circular?: boolean; className?: string }) {
  const icon = SAINT_DISPLAY_ICONS[saintId];
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <span className={cn("block aspect-square shrink-0 overflow-hidden", icon?.image_fit === "contain" ? "" : "border border-border bg-muted", circular ? "rounded-full" : "rounded-lg", className)}>
      {icon && icon.image_url !== failedUrl ? (
        <img src={icon.image_url} alt="" decoding="async" onError={() => setFailedUrl(icon.image_url)} className={cn("saint-portrait-image h-full w-full", icon.image_fit === "contain" ? "object-contain" : "object-cover object-[center_30%]")} />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-muted-foreground"><Cross aria-hidden="true" className="h-7 w-7" /></span>
      )}
    </span>
  );
}