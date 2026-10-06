import { useLayoutEffect, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saintsContent } from "@/data/saintsContent";
import type { SaintDetail } from "@/data/saintTypes";
import { SAINT_CATEGORIES, type SaintCategoryId } from "@/data/saintCategories";
import { CATEGORY_SUBCATEGORIES, SAINT_SUBCATEGORY_MEMBERS, getCategorySaints, getCategoryTags } from "@/data/saintBrowser";
import { SAINT_CATEGORY_DISPLAY_ICON, SAINT_DISPLAY_ICONS } from "@/data/saintDisplayIcons";
import { SaintPortrait } from "./SaintPortrait";

export function SaintsBrowser({ onSelect, onClose }: { onSelect: (saint: SaintDetail) => void; onClose: () => void }) {
  const [category, setCategory] = useState<SaintCategoryId | null>(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const selectedCategory = SAINT_CATEGORIES.find(item => item.id === category);
  const subcategories = category ? CATEGORY_SUBCATEGORIES[category] : undefined;
  const tags = category ? getCategoryTags(saintsContent, category) : [];
  const categorySaints = getCategorySaints(saintsContent, category, query, tag);
  const saints = subcategory ? categorySaints.filter(saint => SAINT_SUBCATEGORY_MEMBERS[subcategory]?.includes(saint.id)) : categorySaints;
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [category]);

  function back() {
    if (category) { setCategory(null); setTag(null); setSubcategory(null); } else onClose();
  }

  return (
    <section className="bg-card border border-border/50 rounded-lg">
      <div className="p-4 border-b border-border/50">
        <Button variant="ghost" onClick={back}><ArrowLeft className="h-4 w-4" />Back</Button>
      </div>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-1">{selectedCategory?.label ?? "Saints"}</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input type="search" placeholder="Search a saint by name…" aria-label="Search saints" value={query} onChange={event => setQuery(event.target.value)} className="pl-9" />
        </div>
        {selectedCategory ? (
          <>
            {subcategories && <div className="flex flex-wrap items-start gap-2 pb-3 mb-2" aria-label="Sub-categories">
              <Button size="sm" variant={subcategory === null ? "secondary" : "ghost"} aria-pressed={subcategory === null} onClick={() => setSubcategory(null)} className="rounded-full border border-border">All</Button>
              {subcategories.map(item => <Button key={item} size="sm" variant={subcategory === item ? "secondary" : "ghost"} aria-pressed={subcategory === item} onClick={() => setSubcategory(subcategory === item ? null : item)} className="rounded-full border border-border">{item}</Button>)}
            </div>}
            {!subcategories && tags.length > 0 && <div className="flex gap-2 overflow-x-auto pb-3 mb-2" aria-label="Saint tags">
              <Button size="sm" variant={tag === null ? "secondary" : "ghost"} aria-pressed={tag === null} onClick={() => setTag(null)} className="shrink-0 rounded-full border border-border">All</Button>
              {tags.map(item => <Button key={item.label} size="sm" variant={tag === item.label ? "secondary" : "ghost"} aria-pressed={tag === item.label} onClick={() => setTag(tag === item.label ? null : item.label)} className="shrink-0 rounded-full border border-border">{item.label}</Button>)}
            </div>}
            <SaintRows saints={saints} onSelect={onSelect} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {SAINT_CATEGORIES.map((item, index) => {
                // An odd tile count centers the final box under both columns.
                const centered = index === SAINT_CATEGORIES.length - 1 && SAINT_CATEGORIES.length % 2 === 1;
                const tile = <Button variant="ghost" onClick={() => { setCategory(item.id); setTag(null); }} className="w-full h-auto min-w-0 p-0 gap-0 flex-col items-center whitespace-normal text-center hover:bg-transparent">
                  <SaintPortrait saintId={SAINT_CATEGORY_DISPLAY_ICON[item.id]} className="w-full" />
                  <span className="mt-2 h-10 w-full text-sm font-medium leading-5 line-clamp-2">{item.label}</span>
                </Button>;
                return centered
                  ? <div key={item.id} className="col-span-2 flex justify-center"><div className="w-[calc(50%-6px)]">{tile}</div></div>
                  : tile;
              })}
            </div>
            {query.trim() && saints.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No saints found matching “{query}”</p>}
            {query.trim() && <SaintRows saints={saints} onSelect={onSelect} />}
            <details className="mt-4 text-xs text-muted-foreground">
              <summary className="cursor-pointer">Icon credits</summary>
              <div className="mt-2 space-y-2 break-words">
                {[...new Set(Object.values(SAINT_CATEGORY_DISPLAY_ICON))].map(id => {
                  const icon = SAINT_DISPLAY_ICONS[id];
                  return icon ? <p key={id}><a href={icon.image_source} target="_blank" rel="noopener noreferrer" className="underline">{id.replace(/-/g, " ")}</a>{" · "}<a href={icon.image_license_url} target="_blank" rel="noopener noreferrer" className="underline">{icon.image_license}</a><span className="block">{icon.image_author}</span><span className="block">{icon.image_modification}</span></p> : null;
                })}
              </div>
            </details>
          </>
        )}
      </div>
    </section>
  );
}

function SaintRows({ saints, onSelect }: { saints: SaintDetail[]; onSelect: (saint: SaintDetail) => void }) {
  return <div className="divide-y divide-border">{saints.map(saint => <Button key={saint.id} variant="ghost" onClick={() => onSelect(saint)} className="h-auto w-full justify-start gap-3 px-0 py-3 text-left">
    <SaintPortrait saintId={saint.id} circular className="h-12 w-12" />
    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{[saint.prefix, saint.name, saint.epithet].filter(Boolean).join(" ")}</span><span className="mt-1 block truncate text-xs font-normal text-muted-foreground">{saint.shortDescription}</span></span>
  </Button>)}</div>;
}