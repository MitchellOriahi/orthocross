import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PrayerDetail } from "@/data/prayersContent";

export function PrayerListCard({ prayer, isPinned, onSelect, onPin, paths }: { prayer: PrayerDetail; isPinned: boolean; onSelect: (prayer: PrayerDetail) => void; onPin?: (id: string) => void; paths?: string[] }) {
  return (
    <div className="relative group" data-prayer-id={prayer.id}>
      <Button variant="ghost" onClick={() => onSelect(prayer)} className={`block h-auto w-full p-4 text-left whitespace-normal rounded-lg border hover:border-primary hover:bg-accent transition-all relative ${isPinned ? "border-primary bg-primary/5" : "border-border"}`}>
        <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-md bg-primary/10 font-medium">
          {prayer.tradition === "Oriental" ? <span className="text-tradition-oriental">Oriental</span> : prayer.tradition === "Eastern" ? <span className="text-tradition-eastern">Eastern</span> : <><span className="text-tradition-eastern">E</span><span className="text-primary">/</span><span className="text-tradition-oriental">O</span></>}
        </span>
        <span className="block font-semibold text-base pr-20 break-words">
          {isPinned && <Pin className="inline w-4 h-4 mr-2 text-primary fill-primary" />}
          {prayer.name === "Coptic 'Our Father'" ? <span className="inline-flex flex-col leading-tight"><span>Coptic</span><span>"Our Father"</span></span> : prayer.name}
        </span>
        <span className="block text-sm font-normal text-muted-foreground mt-1 break-words">{prayer.title}</span>
        {paths?.map(path => <span key={path} className="block text-xs font-normal text-muted-foreground mt-1 break-words">{path}</span>)}
      </Button>
      {onPin && <Button variant="ghost" size="icon" title={isPinned ? "Unpin prayer" : "Pin prayer"} aria-label={`${isPinned ? "Unpin" : "Pin"} ${prayer.name}`} className="absolute right-2 bottom-2 h-8 w-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity z-10" onClick={() => onPin(prayer.id)}><Pin className={`w-4 h-4 ${isPinned ? "fill-primary text-primary" : ""}`} /></Button>}
    </div>
  );
}