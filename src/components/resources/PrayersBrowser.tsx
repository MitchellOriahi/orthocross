import { useLayoutEffect, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PrayerDetail } from "@/data/prayersContent";
import type { PrayerTraditionFilter } from "@/data/prayerSearch";
import { PRAYER_CATEGORIES, PRAYER_PLACEMENTS, type PrayerCategoryId } from "@/data/prayerCategories";
import { getPrayerList, getPrayerSubgroups } from "@/data/prayerCatalog";
import { SAINT_DISPLAY_ICONS } from "@/data/saintDisplayIcons";
import david from "@/assets/saints/card-icons/david-portrait.jpg.asset.json";
import { SaintPortrait } from "./SaintPortrait";
import { PrayerListCard } from "./PrayerListCard";

const THUMBNAILS: Record<PrayerCategoryId, string> = { foundational: "peter-apostle", daily: "saint-anthony-lrp", "christ-saints": "theotokos-seven-swords-lrp", psalms: "david", communion: "saint-nicholas-lrp", occasions: "archangel-michael" };

export function PrayersBrowser({ onSelect, onClose, tradition, onTraditionChange, pinnedIds, onPin }: { onSelect: (prayer: PrayerDetail) => void; onClose: () => void; tradition: PrayerTraditionFilter; onTraditionChange: (tradition: PrayerTraditionFilter) => void; pinnedIds: ReadonlySet<string>; onPin?: (id: string) => void }) {
  const [category, setCategory] = useState<PrayerCategoryId | null>(null);
  const [landingQuery, setLandingQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [subgroup, setSubgroup] = useState<string | null>(null);
  const [dismissedQuery, setDismissedQuery] = useState<string | null>(null);
  const query = category ? categoryQuery : landingQuery;
  const selectedCategory = PRAYER_CATEGORIES.find(item => item.id === category);
  const prayers = getPrayerList(category, subgroup, query, category ? tradition : "all", pinnedIds);
  const subgroups = category ? getPrayerSubgroups(category) : [];
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [category]);

  function selectPrayer(prayer: PrayerDetail) {
    if (!category) setLandingQuery("");
    onSelect(prayer);
  }
  function paths(id: string) {
    return (PRAYER_PLACEMENTS[id] ?? []).map(placement => `${PRAYER_CATEGORIES.find(item => item.id === placement.category)?.label} → ${placement.subgroup}`);
  }

  return (
    <section className="bg-card border border-border/50 rounded-lg">
      <div className="p-4 border-b border-border/50"><Button variant="ghost" onClick={() => { if (category) { setCategory(null); setSubgroup(null); setCategoryQuery(""); onTraditionChange("all"); } else onClose(); }}><ArrowLeft className="h-4 w-4" />Back</Button></div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
          <h2 className="text-2xl font-semibold min-w-0 break-words">{selectedCategory?.label ?? "Prayers"}</h2>
          {selectedCategory && <div className="flex gap-2" role="group" aria-label="Prayer tradition">
            {(["all", "Eastern", "Oriental"] as const).map(filter => <Button key={filter} size="sm" variant={tradition === filter ? "default" : "outline"} aria-pressed={tradition === filter} onClick={() => onTraditionChange(filter)} className={tradition === filter || filter === "all" ? "" : filter === "Eastern" ? "text-tradition-eastern hover:text-tradition-eastern border-tradition-eastern/50" : "text-tradition-oriental hover:text-tradition-oriental border-tradition-oriental/50"}>{filter === "all" ? "All" : filter}</Button>)}
          </div>}
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input type="search" placeholder="Search a prayer by name…" aria-label={category ? "Search prayers in category" : "Search prayers"} value={query} onChange={event => { (category ? setCategoryQuery : setLandingQuery)(event.target.value); setDismissedQuery(null); }} onKeyDown={event => { if (event.key === "Escape") setDismissedQuery(query); }} className="pl-9" />
          {!category && query.trim() && dismissedQuery !== query && <div aria-label="Prayer search suggestions" className="absolute inset-x-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg">
            {prayers.length ? prayers.map(prayer => <PrayerListCard key={prayer.id} prayer={prayer} isPinned={pinnedIds.has(prayer.id)} onSelect={selectPrayer} paths={paths(prayer.id)} />) : <p className="py-4 text-center text-sm text-muted-foreground">No prayers found matching "{query}"</p>}
          </div>}
        </div>
        {selectedCategory ? <>
          <div className="-mx-6 overflow-x-auto pb-4 mb-2" aria-label="Prayer micro categories" key={category}>
            <div className="flex gap-2 w-max min-w-full px-6">
              {["All", ...subgroups].map(item => <Button key={item} size="sm" variant={(item === "All" ? subgroup === null : subgroup === item) ? "secondary" : "ghost"} aria-pressed={item === "All" ? subgroup === null : subgroup === item} onClick={() => setSubgroup(item === "All" || subgroup === item ? null : item)} className="shrink-0 rounded-full border border-border">{item}</Button>)}
            </div>
          </div>
          <div className="space-y-2" aria-label="Prayer list">{prayers.map(prayer => <PrayerListCard key={prayer.id} prayer={prayer} isPinned={pinnedIds.has(prayer.id)} onSelect={selectPrayer} onPin={onPin} />)}</div>
          {!prayers.length && <p className="py-6 text-center text-sm text-muted-foreground">{query.trim() ? `No prayers found matching "${query}"` : "No prayers here yet."}</p>}
        </> : <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PRAYER_CATEGORIES.map(item => <Button key={item.id} variant="ghost" onClick={() => { setCategory(item.id); setCategoryQuery(""); setSubgroup(null); onTraditionChange("all"); }} className="w-full h-auto min-w-0 p-0 gap-0 flex-col items-center whitespace-normal text-center hover:bg-transparent">
              {item.id === "psalms" ? <span className="block aspect-square w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted"><img src={david.url} alt="" decoding="async" className="h-full w-full object-cover object-[center_30%] saint-portrait-image" /></span> : <SaintPortrait saintId={THUMBNAILS[item.id]} className="w-full" />}
              <span className="mt-2 min-h-10 w-full text-sm font-medium leading-5">{item.label}</span>
            </Button>)}
          </div>
          <details className="mt-4 text-xs text-muted-foreground"><summary className="cursor-pointer">Icon credits</summary><div className="mt-2 space-y-2 break-words">
            {PRAYER_CATEGORIES.filter(item => item.id !== "psalms").map(item => { const icon = SAINT_DISPLAY_ICONS[THUMBNAILS[item.id]]; return icon ? <p key={item.id}><a href={icon.image_source} target="_blank" rel="noopener noreferrer" className="underline">{item.label}</a>{" · "}{icon.image_author}{" · "}{icon.image_license}</p> : null; })}
            <p><a href="https://commons.wikimedia.org/wiki/File:David-icon.jpg" target="_blank" rel="noopener noreferrer" className="underline">Psalms and Canticles</a>{" · 18th-century icon painter · Public domain"}</p>
          </div></details>
        </>}
      </div>
    </section>
  );
}