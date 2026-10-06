import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SaintDetail } from "@/data/saintTypes";

export function SaintListCard({ saint, onSelect }: { saint: SaintDetail; onSelect: (saint: SaintDetail) => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <Button variant="ghost" onClick={() => onSelect(saint)} className="relative h-auto w-full items-start justify-start gap-4 whitespace-normal rounded-lg border border-border p-4 text-left hover:border-primary hover:bg-accent">
      <span className="block h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
        {saint.iconUrl && !failed ? <img src={saint.iconUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <span className="flex h-full w-full items-center justify-center text-muted-foreground"><svg aria-hidden="true" viewBox="0 0 32 44" className="!h-9 !w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 3v38M10 10h12M4 18h24M9 29l14 7" /></svg></span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block pr-16 text-base font-semibold leading-5 break-words">
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