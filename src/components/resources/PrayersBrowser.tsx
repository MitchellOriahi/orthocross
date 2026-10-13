import { useLayoutEffect, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PrayerDetail } from "@/data/prayersContent";
import type { PrayerTraditionFilter } from "@/data/prayerSearch";
import { PRAYER_CATEGORIES, PRAYER_PLACEMENTS, type PrayerCategoryId } from "@/data/prayerCategories";
import { getPrayerList, getPrayerSubgroups } from "@/data/prayerCatalog";
import foundationalBook from "@/assets/prayers/categories/foundational_prayers_christ.jpg.asset.json";
import psalmsLamb from "@/assets/prayers/categories/psalms_david_lyre.jpg.asset.json";
import dailyBread from "@/assets/prayers/categories/daily_prayers_prosphora.jpg.asset.json";
import crucifix from "@/assets/prayers/categories/christ_and_saints_crucifix.jpg.asset.json";
import melismos from "@/assets/prayers/categories/holy_communion_melismos.jpg.asset.json";
import occasionsRaised from "@/assets/prayers/categories/occasions_good_shepherd.jpg.asset.json";
import { PrayerListCard } from "./PrayerListCard";
import { SubcategoryPills } from "./SaintsBrowser";
import { CategoryIconStyleMenu } from "./CategoryIconStyleMenu";
import { CategoryArtwork, CategoryArtworkCredit } from "./CategoryArtwork";
import { categoryArtwork } from "@/data/categoryStyleArtwork";
import { useCategoryIconStyle } from "@/hooks/useCategoryIconStyle";

// Prayer artwork is independent of the Saints category portrait registry.
const THUMBNAILS: Record<PrayerCategoryId, { url: string; source: string | null; author: string; license: string }> = {
  foundational: { url: foundationalBook.url, source: null, author: "Byzantine icon detail: a hand holds a Gospel book whose cover bears the Crucifixion", license: "Photograph supplied by the app owner" },
  daily: { url: dailyBread.url, source: null, author: "Still-life painting: three prosphora loaves marked with crosses beside a lit candle and sheaves of wheat", license: "Photograph supplied by the app owner" },
  "christ-saints": { url: crucifix.url, source: null, author: "Contemporary icon detail: a monastic’s hands hold a wooden crucifix and a prayer rope", license: "Photograph supplied by the app owner" },
  psalms: { url: psalmsLamb.url, source: null, author: "Byzantine icon detail: a lamb held in an outstretched hand", license: "Photograph supplied by the app owner" },
  communion: { url: melismos.url, source: null, author: "Byzantine icon: the Melismos — the Christ Child upon the golden paten behind the altar", license: "Photograph supplied by the app owner" },
  occasions: { url: occasionsRaised.url, source: null, author: "Byzantine icon detail: the Anastasis — a hand clasping the hand of the one being raised", license: "Photograph supplied by the app owner" },
};

export function PrayersBrowser({ onSelect, onClose, tradition, onTraditionChange, pinnedIds, onPin }: { onSelect: (prayer: PrayerDetail) => void; onClose: () => void; tradition: PrayerTraditionFilter; onTraditionChange: (tradition: PrayerTraditionFilter) => void; pinnedIds: ReadonlySet<string>; onPin?: (id: string) => void }) {
  const { style } = useCategoryIconStyle();
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
          {!selectedCategory && <CategoryIconStyleMenu />}
          {selectedCategory && <div className="flex gap-2" role="group" aria-label="Prayer tradition">
            {(["all", "Eastern", "Oriental"] as const).map(filter => <Button key={filter} size="sm" variant={tradition === filter ? "default" : "outline"} aria-pressed={tradition === filter} onClick={() => onTraditionChange(filter)} className={tradition === filter || filter === "all" ? "" : filter === "Eastern" ? "text-tradition-eastern hover:text-tradition-eastern border-tradition-eastern/50" : "text-tradition-oriental hover:text-tradition-oriental border-tradition-oriental/50"}>{filter === "all" ? "All" : filter}</Button>)}
          </div>}
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input type="search" placeholder="Search a prayer by name…" aria-label={category ? "Search prayers in category" : "Search prayers"} value={query} onChange={event => { (category ? setCategoryQuery : setLandingQuery)(event.target.value); setDismissedQuery(null); }} onKeyDown={event => { if (event.key === "Escape") setDismissedQuery(query); }} className="pl-9" />
          {!category && query.trim() && dismissedQuery !== query && <div aria-label="Prayer search suggestions" className="absolute inset-x-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg">
            {prayers.length ? <div className="space-y-2">{prayers.map(prayer => <PrayerListCard key={prayer.id} prayer={prayer} isPinned={pinnedIds.has(prayer.id)} onSelect={selectPrayer} paths={paths(prayer.id)} />)}</div> : <p className="py-4 text-center text-sm text-muted-foreground">No prayers found matching "{query}"</p>}
          </div>}
        </div>
        {selectedCategory ? <>
          <div key={category} aria-label="Prayer micro categories">
            <SubcategoryPills items={["All", ...subgroups]} active={subgroup} onToggle={item => setSubgroup(item === "All" || subgroup === item ? null : item)} />
          </div>
          <div className="space-y-2" aria-label="Prayer list">{prayers.map(prayer => <PrayerListCard key={prayer.id} prayer={prayer} isPinned={pinnedIds.has(prayer.id)} onSelect={selectPrayer} onPin={onPin} />)}</div>
          {!prayers.length && <p className="py-6 text-center text-sm text-muted-foreground">{query.trim() ? `No prayers found matching "${query}"` : "No prayers here yet."}</p>}
        </> : <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PRAYER_CATEGORIES.map(item => { const artwork = categoryArtwork("prayers", style, item.id); return <Button key={item.id} variant="ghost" onClick={() => { setCategory(item.id); setCategoryQuery(""); setSubgroup(null); onTraditionChange("all"); }} className="w-full h-auto min-w-0 p-0 gap-0 flex-col items-center whitespace-normal text-center hover:bg-transparent">
              {artwork ? <CategoryArtwork key={artwork.image_url} artwork={artwork} label={item.label} /> : <span className="block aspect-square w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted"><img src={THUMBNAILS[item.id].url} alt="" decoding="async" className={`h-full w-full object-cover saint-portrait-image ${item.id === "christ-saints" ? "object-[center_34%]" : item.id === "foundational" ? "object-[center_35%]" : item.id === "communion" ? "object-[center_45%]" : item.id === "daily" ? "object-[38%_center]" : item.id === "psalms" ? "object-[center_50%]" : item.id === "occasions" ? "object-[center_50%]" : "object-[center_30%]"}`} /></span>}
              <span className="mt-2 min-h-10 w-full text-sm font-medium leading-5">{item.label}</span>
            </Button>; })}
          </div>
          <details className="mt-4 text-xs text-muted-foreground"><summary className="cursor-pointer">Icon credits</summary><div className="mt-2 space-y-2 break-words">
            {PRAYER_CATEGORIES.map(item => { const alternate = categoryArtwork("prayers", style, item.id); if (alternate) return <CategoryArtworkCredit key={item.id} artwork={alternate} label={item.label} />; const artwork = THUMBNAILS[item.id]; return <p key={item.id}>{artwork.source ? <a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(artwork.source)}`} target="_blank" rel="noopener noreferrer" className="underline">{item.label}</a> : <span>{item.label}</span>}{" · "}{artwork.author}{" · "}{artwork.license}</p>; })}
          </div></details>
        </>}
      </div>
    </section>
  );
}