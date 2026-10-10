import { SaintCardIcon } from "./SaintCardIcon";
import { Button } from "@/components/ui/button";
import type { SaintDetail } from "@/data/saintTypes";

export function SaintListCard({ saint, onSelect }: { saint: SaintDetail; onSelect: (saint: SaintDetail) => void }) {
  return (
    <Button variant="ghost" onClick={() => onSelect(saint)} className={`relative h-auto w-full items-start justify-start gap-4 whitespace-normal rounded-lg border border-border p-4 text-left hover:border-primary hover:bg-accent${saint.id === "theotokos" ? " theotokos-sticker" : ""}`}>
      <SaintCardIcon saintId={saint.id} fallbackUrl={saint.iconUrl} />
      <span className="min-w-0 flex-1">
        <span className="block pr-20 text-base font-semibold leading-5 break-words">
          {saint.prefix && <span className="block">{saint.prefix}</span>}
          {[saint.name, saint.epithet].filter(Boolean).join(" ")}
        </span>
        <span className="mt-2 block text-sm font-normal leading-5 text-muted-foreground">{saint.shortDescription}</span>
      </span>
      <span className="absolute right-3 top-3 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium">
        {saint.tradition === "Eastern" ? <span className="text-tradition-eastern">Eastern</span> : saint.tradition === "Oriental" ? <span className="text-tradition-oriental">Oriental</span> : <><span className="text-tradition-eastern">E</span><span className="text-foreground">/</span><span className="text-tradition-oriental">O</span></>}
      </span>
    </Button>
  );
}