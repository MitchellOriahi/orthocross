import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SaintDetail } from "@/data/saintTypes";
import { SAINT_CATEGORIES, type SaintCategoryId } from "@/data/saintCategories";
import { getSaintMemberships, getSaintPageList, getSaintPageSubgroups, type SaintTraditionFilter } from "@/data/saintPageRoster";
import { SAINT_CATEGORY_DISPLAY_ICON, SAINT_DISPLAY_ICONS } from "@/data/saintDisplayIcons";
import { SaintPortrait } from "./SaintPortrait";
import { SaintListCard } from "./SaintListCard";

export function SaintsBrowser({ onSelect, onClose }: { onSelect: (saint: SaintDetail) => void; onClose: () => void }) {
  const [category, setCategory] = useState<SaintCategoryId | null>(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [tradition, setTradition] = useState<SaintTraditionFilter>("all");
  const selectedCategory = SAINT_CATEGORIES.find(item => item.id === category);
  const subcategories = category ? getSaintPageSubgroups(category) : undefined;
  const saints = getSaintPageList(category, subcategory, query, tradition);
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [category]);

  function back() {
    if (category) { setCategory(null); setTag(null); setSubcategory(null); setTradition("all"); } else onClose();
  }

  return (
    <section className="bg-card border border-border/50 rounded-lg">
      <div className="p-4 border-b border-border/50">
        <Button variant="ghost" onClick={back}><ArrowLeft className="h-4 w-4" />Back</Button>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
          <h2 className="text-2xl font-semibold">{selectedCategory?.label ?? "Saints"}</h2>
          {selectedCategory && (
            <div className="flex gap-2" role="group" aria-label="Saint tradition">
              <Button size="sm" variant={tradition === "all" ? "default" : "outline"} aria-pressed={tradition === "all"} onClick={() => setTradition("all")}>All</Button>
              <Button size="sm" variant={tradition === "Eastern" ? "default" : "outline"} aria-pressed={tradition === "Eastern"} onClick={() => setTradition("Eastern")} className={tradition === "Eastern" ? "" : "text-[hsl(var(--tradition-eastern))] hover:text-[hsl(var(--tradition-eastern))] border-[hsl(var(--tradition-eastern)/0.5)]"}>Eastern</Button>
              <Button size="sm" variant={tradition === "Oriental" ? "default" : "outline"} aria-pressed={tradition === "Oriental"} onClick={() => setTradition("Oriental")} className={tradition === "Oriental" ? "" : "text-[hsl(var(--tradition-oriental))] hover:text-[hsl(var(--tradition-oriental))] border-[hsl(var(--tradition-oriental)/0.5)]"}>Oriental</Button>
            </div>
          )}
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input type="search" placeholder="Search a saint by name…" aria-label="Search saints" value={query} onChange={event => setQuery(event.target.value)} className="pl-9" />
          {!selectedCategory && query.trim() && (
            <div role="listbox" aria-label="Saint search suggestions" className="absolute inset-x-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg">
              {saints.length === 0
                ? <p className="py-4 text-center text-sm text-muted-foreground">No saints found matching “{query}”</p>
                : <SaintSearchRows saints={saints} onSelect={onSelect} />}
            </div>
          )}
        </div>
        {selectedCategory ? (
          <>
            {subcategories && <SubcategoryPills items={["All", ...subcategories]} active={subcategory} onToggle={item => setSubcategory(item === "All" ? null : subcategory === item ? null : item)} />}

            {saints.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No saints here yet.</p>}
            <SaintRows saints={saints} onSelect={onSelect} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {SAINT_CATEGORIES.map((item, index) => {
                // An odd tile count centers the final box under both columns.
                const centered = index === SAINT_CATEGORIES.length - 1 && SAINT_CATEGORIES.length % 2 === 1;
                const tile = <Button variant="ghost" onClick={() => { setCategory(item.id); setTag(null); setSubcategory(null); setTradition("all"); }} className="w-full h-auto min-w-0 p-0 gap-0 flex-col items-center whitespace-normal text-center hover:bg-transparent">
                  <SaintPortrait saintId={SAINT_CATEGORY_DISPLAY_ICON[item.id]} className="w-full" />
                  <span className="mt-2 h-10 w-full text-sm font-medium leading-5 line-clamp-2">{item.label}</span>
                </Button>;
                return centered
                  ? <div key={item.id} className="col-span-2 flex justify-center"><div className="w-[calc(50%-6px)]">{tile}</div></div>
                  : tile;
              })}
            </div>
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

// Subcategory pills fill two rows to the available width before anything overflows;
// once both rows are full, the remaining pills join a single shared carousel,
// distributed so the two rows stay evenly filled while it slides.
function SubcategoryPills({ items, active, onToggle }: { items: string[]; active: string | null; onToggle: (item: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<string[][]>(() => {
    const mid = Math.ceil(items.length / 2);
    return [items.slice(0, mid), items.slice(mid)];
  });

  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    const measure = measureRef.current;
    if (!scroll || !measure) return;
    const updateRows = () => {
    const GAP = 8;
    // The px-6 insets leave 48px of the scroll container's width for pills.
    const limit = scroll.clientWidth - 48;
    const pills = Array.from(measure.children) as HTMLElement[];
    const widths = items.map((_, index) => pills[index]?.offsetWidth ?? 0);
    const next: string[][] = [[], []];
    const rowWidths = [0, 0];
    let currentRow = 0;
    items.forEach((item, index) => {
      const width = widths[index];
      if (currentRow < 2) {
        const rowGap = next[currentRow].length ? GAP : 0;
        if (rowWidths[currentRow] + width + rowGap > limit) currentRow += 1;
      }
      if (currentRow >= 2) {
        // Both rows are full: keep them evenly filled as the carousel grows.
        const row = rowWidths[0] <= rowWidths[1] ? 0 : 1;
        next[row].push(item);
        rowWidths[row] += width + (next[row].length > 1 ? GAP : 0);
      } else {
        const rowGap = next[currentRow].length ? GAP : 0;
        next[currentRow].push(item);
        rowWidths[currentRow] += width + rowGap;
      }
    });
    setRows(next);
    };
    updateRows();
    scroll.scrollLeft = 0;
    const observer = new ResizeObserver(updateRows);
    observer.observe(scroll);
    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="-mx-6 overflow-x-auto pb-4 mb-2" aria-label="Sub-categories" ref={scrollRef}>
      <div className="flex flex-col gap-2 w-max min-w-full px-6">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.map(item => (
              <Button key={item} size="sm" variant={item === "All" ? active === null ? "secondary" : "ghost" : active === item ? "secondary" : "ghost"} aria-pressed={item === "All" ? active === null : active === item} onClick={() => onToggle(item)} className="shrink-0 rounded-full border border-border">{item}</Button>
            ))}
          </div>
        ))}
      </div>
      <div ref={measureRef} aria-hidden="true" className="fixed left-[-9999px] top-0 invisible pointer-events-none flex gap-2 w-max -z-50">
        {items.map(item => <Button key={item} size="sm" tabIndex={-1} variant="ghost" className="shrink-0 rounded-full border border-border">{item}</Button>)}
      </div>
    </div>
  );
}

function SaintRows({ saints, onSelect }: { saints: SaintDetail[]; onSelect: (saint: SaintDetail) => void }) {
  return <div className="space-y-2" aria-label="Saint list">{saints.map(saint => <SaintListCard key={saint.id} saint={saint} onSelect={onSelect} />)}</div>;
}

// Landing-page search results: mini cards showing each match with its
// category → subgroup path and tradition tag.
function SaintSearchRows({ saints, onSelect }: { saints: SaintDetail[]; onSelect: (saint: SaintDetail) => void }) {
  return <div className="space-y-2" aria-label="Saint search results">{saints.map(saint => <SaintSearchCard key={saint.id} saint={saint} onSelect={onSelect} />)}</div>;
}

function SaintSearchCard({ saint, onSelect }: { saint: SaintDetail; onSelect: (saint: SaintDetail) => void }) {
  const [failed, setFailed] = useState(false);
  const paths = getSaintMemberships(saint.id).map(item => {
    const label = SAINT_CATEGORIES.find(category => category.id === item.category)?.label ?? item.category;
    return `${label} → ${item.subgroup}`;
  });
  return (
    <Button variant="ghost" onClick={() => onSelect(saint)} className="relative h-auto w-full items-start justify-start gap-3 whitespace-normal rounded-lg border border-border p-3 text-left hover:border-primary hover:bg-accent">
      <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
        {saint.iconUrl && !failed ? <img src={saint.iconUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <span className="flex h-full w-full items-center justify-center text-muted-foreground"><svg aria-hidden="true" viewBox="0 0 32 44" className="!h-6 !w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 3v38M10 10h12M4 18h24M9 29l14 7" /></svg></span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block pr-14 text-sm font-semibold leading-5 break-words">
          {saint.prefix && <span>{saint.prefix} </span>}
          {[saint.name, saint.epithet].filter(Boolean).join(" ")}
        </span>
        {paths.map(path => <span key={path} className="mt-1 block text-xs font-normal leading-4 text-muted-foreground">{path}</span>)}
      </span>
      <span className="absolute right-3 top-3 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium">
        {saint.tradition === "Eastern" ? <span className="text-tradition-eastern">Eastern</span> : saint.tradition === "Oriental" ? <span className="text-tradition-oriental">Oriental</span> : <><span className="text-tradition-eastern">E</span><span className="text-foreground">/</span><span className="text-tradition-oriental">O</span></>}
      </span>
    </Button>
  );
}