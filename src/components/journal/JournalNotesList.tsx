import { Plus, Search, Trash2, Pin, PinOff, LayoutGrid, List, Layers, ChevronDown, ChevronRight, Flame, BookOpen, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface JournalNote {
  id: string;
  title: string | null;
  content: string | null;
  updated_at: string;
  pinned: boolean;
}

export interface HighlightGroup {
  book: string;
  count: number;
  firstChapter: number;
  colors: string[];
}

interface JournalNotesListProps {
  notes: JournalNote[];
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  onNoteCreate: () => void;
  onNoteDelete: (noteId: string) => void;
  onNotePin: (noteId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'list' | 'gallery';
  onViewModeChange: (mode: 'list' | 'gallery') => void;
  todayEntry?: JournalNote | null;
  onOpenToday?: () => void;
  userId?: string;
  highlightGroups?: HighlightGroup[];
  onOpenHighlights?: (book: string) => void;
}

const MOODS = [
  { emoji: "🙏", label: "Grateful" },
  { emoji: "🕊️", label: "Peaceful" },
  { emoji: "🌅", label: "Hopeful" },
  { emoji: "🌧️", label: "Heavy-hearted" },
  { emoji: "💧", label: "Repentant" },
];

const HIGHLIGHT_DOT: Record<string, string> = {
  yellow: "bg-yellow-400",
  green: "bg-green-400",
  blue: "bg-blue-400",
  pink: "bg-pink-400",
  purple: "bg-purple-400",
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const entryDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const JournalNotesList = ({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNoteCreate,
  onNoteDelete,
  onNotePin,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  todayEntry = null,
  onOpenToday,
  userId,
  highlightGroups = [],
  onOpenHighlights,
}: JournalNotesListProps) => {
  const [expandedStacks, setExpandedStacks] = useState<Set<string>>(new Set());
  const [mood, setMood] = useState<string | null>(() => {
    if (!userId) return null;
    try { return localStorage.getItem(`journal_mood_${userId}_${dayKey(new Date())}`); } catch { return null; }
  });
  const [moodOpen, setMoodOpen] = useState(false);

  const streak = useMemo(() => {
    const days = new Set(notes.map(n => dayKey(new Date(n.updated_at))));
    let s = 0;
    const cursor = new Date();
    if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(dayKey(cursor))) {
      s++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return s;
  }, [notes]);

  const chooseMood = (label: string) => {
    const next = mood === label ? null : label;
    setMood(next);
    setMoodOpen(false);
    if (!userId) return;
    const key = `journal_mood_${userId}_${dayKey(new Date())}`;
    try {
      if (next) localStorage.setItem(key, next);
      else localStorage.removeItem(key);
    } catch {}
  };

  const moodEmoji = MOODS.find(m => m.label === mood)?.emoji;

  const toggleStack = (key: string) => {
    setExpandedStacks((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const BIBLE_BOOK_ORDER = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
    "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles",
    "Ezra","Nehemiah","Esther","Job","Psalms","Psalm","Proverbs","Ecclesiastes",
    "Song of Solomon","Song of Songs","Isaiah","Jeremiah","Lamentations","Ezekiel",
    "Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk",
    "Zephaniah","Haggai","Zechariah","Malachi","Tobit","Judith","Wisdom","Sirach",
    "Baruch","1 Maccabees","2 Maccabees","3 Maccabees","1 Esdras","2 Esdras",
    "Prayer of Manasseh",
    "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians",
    "Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians",
    "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter",
    "1 John","2 John","3 John","Jude","Revelation",
  ];

  // Canonical list of Bible book names so we can classify a note by its title
  const BIBLE_BOOKS = new Set<string>(BIBLE_BOOK_ORDER);

  // Extract a verse reference like "Genesis 1:1" from a note (heading in content)
  const getVerseRef = (note: JournalNote): string | null => {
    const content = note.content || "";
    const stripped = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const m = stripped.match(/([1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)?)\s+(\d+)\s*:\s*(\d+)/);
    if (m) return `${m[1].trim()} ${m[2]}:${m[3]}`;
    return null;
  };

  const isBibleBookTitle = (note: JournalNote) => {
    const t = (note.title || "").trim();
    if (BIBLE_BOOKS.has(t)) return true;
    for (const book of BIBLE_BOOKS) {
      if (t === book) return true;
      if (t.startsWith(book + " ") || t.startsWith(book + ":")) return true;
    }
    return false;
  };

  const getPreviewText = (note: JournalNote, titleOverride?: string) => {
    const content = note.content || "";
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    const hasImage = !!imgMatch;
    const imageSrc = imgMatch ? imgMatch[1] : null;

    const textContent = content
      .replace(/<img[^>]*>/g, '')
      .replace(/<audio[^>]*>.*?<\/audio>/g, '')
      .replace(/<video[^>]*>.*?<\/video>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .trim();

    const preview = textContent.substring(0, 100);
    const rawTitle = titleOverride ?? (note.title || "").trim();
    return { title: rawTitle, preview, hasImage, imageSrc };
  };

  // Today's entry renders in its own slot at the top, never duplicated below
  const otherNotes = notes.filter(n => n.id !== todayEntry?.id);
  const pinnedNotes = otherNotes.filter(n => n.pinned);
  const unpinnedNotes = otherNotes.filter(n => !n.pinned);

  const sectionLabel = (text: string) => (
    <div className="flex items-center gap-2 px-1 mb-2 mt-5 first:mt-0">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{text}</h4>
      <div className="flex-1 h-px bg-border/70" />
    </div>
  );

  const renderTodaySlot = () => {
    if (!onOpenToday) return null;
    if (todayEntry) {
      const { preview } = getPreviewText(todayEntry);
      return (
        <button
          onClick={() => onNoteSelect(todayEntry.id)}
          className={cn(
            "w-full text-left p-3.5 rounded-xl bg-card border transition-colors hover:bg-accent/50",
            selectedNoteId === todayEntry.id ? "border-primary/50 bg-accent" : "border-border"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-2 py-0.5">Today</span>
            {moodEmoji && <span className="text-sm leading-none">{moodEmoji}</span>}
            <span className="flex-1" />
            <span className="text-xs text-muted-foreground">{entryDate(todayEntry.updated_at)}</span>
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2 mt-1.5">
            {preview || "Continue writing…"}
          </div>
        </button>
      );
    }
    return (
      <button
        onClick={onOpenToday}
        className="w-full text-left p-3.5 rounded-xl bg-card border border-border transition-colors hover:bg-accent/50 flex items-center gap-2.5"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-2 py-0.5">Today</span>
        <span className="text-sm text-muted-foreground flex-1">Write today's entry</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  };

  const renderListNote = (note: JournalNote, titleOverride?: string) => {
    const { title, preview } = getPreviewText(note, titleOverride);
    const displayTitle = title || (preview ? preview.substring(0, 40) : "New Note");
    const showBody = !!title && !!preview;
    return (
      <div
        key={note.id}
        className={cn(
          "group relative p-3.5 rounded-xl bg-card border transition-colors",
          selectedNoteId === note.id ? "border-primary/50 bg-accent" : "border-border hover:bg-accent/50"
        )}
      >
        <button
          onClick={() => onNoteSelect(note.id)}
          className="w-full text-left"
        >
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-medium text-sm truncate">{displayTitle}</div>
            <div className="text-xs text-muted-foreground whitespace-nowrap group-hover:opacity-0 transition-opacity">
              {entryDate(note.updated_at)}
            </div>
          </div>
          {showBody && (
            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {preview}
            </div>
          )}
        </button>
        <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onNotePin(note.id);
            }}
          >
            {note.pinned ? (
              <PinOff className="h-3 w-3" />
            ) : (
              <Pin className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onNoteDelete(note.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  const renderGalleryNote = (note: JournalNote, titleOverride?: string) => {
    const { title, preview, hasImage, imageSrc } = getPreviewText(note, titleOverride);
    return (
      <div
        key={note.id}
        className={cn(
          "group relative rounded-xl transition-all",
          selectedNoteId === note.id ? "bg-accent/60" : "hover:shadow-md"
        )}
      >
        <button
          onClick={() => onNoteSelect(note.id)}
          className="w-full text-left bg-card border border-border rounded-xl overflow-hidden block"
        >
          <div className="aspect-square bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center overflow-hidden">
            {hasImage && imageSrc ? (
              <img
                src={imageSrc}
                alt="Note preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-4 text-sm text-muted-foreground line-clamp-6 text-center">
                {preview || ""}
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="font-medium text-sm truncate mb-1 min-h-[1.25rem]">
              {title}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
            </div>
          </div>
        </button>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-background/80 backdrop-blur"
            onClick={(e) => {
              e.stopPropagation();
              onNotePin(note.id);
            }}
          >
            {note.pinned ? (
              <PinOff className="h-3 w-3" />
            ) : (
              <Pin className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-background/80 backdrop-blur"
            onClick={(e) => {
              e.stopPropagation();
              onNoteDelete(note.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  // Split notes into personal vs Bible
  const isBibleNote = (n: JournalNote) => getVerseRef(n) !== null || isBibleBookTitle(n);
  const bibleNotes = unpinnedNotes.filter(isBibleNote);
  const personalNotes = unpinnedNotes.filter((n) => !isBibleNote(n));

  const getBookKey = (n: JournalNote): string => {
    const raw = (n.title || "Untitled").trim();
    for (const book of BIBLE_BOOKS) {
      if (raw === book) return book;
      if (raw.startsWith(book + " ") || raw.startsWith(book + ":")) return book;
    }
    const ref = getVerseRef(n);
    if (ref) {
      const m = ref.match(/^([1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)?)\s+\d+/);
      if (m) return m[1].trim();
    }
    return raw;
  };

  const getRef = (n: JournalNote): { ch: number; vs: number } => {
    const src = `${n.title || ""} ${n.content || ""}`;
    const m = src.match(/(\d+)\s*:\s*(\d+)/);
    return m ? { ch: parseInt(m[1], 10), vs: parseInt(m[2], 10) } : { ch: -1, vs: -1 };
  };

  const groups = new Map<string, JournalNote[]>();
  const order: string[] = [];
  for (const n of bibleNotes) {
    const key = getBookKey(n);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(n);
  }
  order.sort((a, b) => BIBLE_BOOK_ORDER.indexOf(a) - BIBLE_BOOK_ORDER.indexOf(b));
  for (const key of order) {
    groups.get(key)!.sort((a, b) => {
      const ra = getRef(a), rb = getRef(b);
      if (rb.ch !== ra.ch) return rb.ch - ra.ch;
      return rb.vs - ra.vs;
    });
  }

  const renderStackCard = (key: string, items: JournalNote[]) => {
    const isExpanded = expandedStacks.has(key);
    const latest = items[0];
    const { preview } = getPreviewText(latest);
    return (
      <div key={`stack-${key}`} className="relative">
        <button
          onClick={() => toggleStack(key)}
          className={cn(
            "w-full text-left p-3.5 rounded-xl transition-colors",
            "hover:bg-accent/50 bg-card border border-border"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <Layers className="h-3 w-3 text-muted-foreground" />
            <div className="font-medium text-sm truncate flex-1">{key}</div>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{items.length}</span>
          </div>
          <div className="text-xs text-muted-foreground line-clamp-1 pl-5">{preview}</div>
        </button>
        {isExpanded && (
          <div className={cn("mt-2 space-y-1.5", viewMode === 'list' ? "ml-4 pl-3 border-l-2 border-border" : "")}>
            {items.map((n) => {
              const ref = getVerseRef(n) ?? (n.title || "Untitled");
              return viewMode === 'list' ? renderListNote(n, ref) : renderGalleryNote(n, ref);
            })}
          </div>
        )}
      </div>
    );
  };

  const hasBibleSection = bibleNotes.length > 0 || highlightGroups.length > 0;

  return (
    <div className="relative flex flex-col h-full border-r border-border bg-card/30">
      <div className="p-3 border-b border-border space-y-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search your journal..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-9 text-sm rounded-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Popover open={moodOpen} onOpenChange={setMoodOpen}>
            <PopoverTrigger asChild>
              <button className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-accent transition-colors inline-flex items-center gap-1.5">
                {moodEmoji ? <>{moodEmoji} {mood}</> : <>Mood <ChevronDown className="h-3 w-3" /></>}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-1.5 flex gap-1">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => chooseMood(m.label)}
                  className={cn(
                    "w-9 h-9 rounded-full text-lg flex items-center justify-center transition-colors",
                    mood === m.label ? "bg-primary/15 ring-1 ring-primary" : "hover:bg-accent"
                  )}
                  title={m.label}
                  aria-pressed={mood === m.label}
                >
                  {m.emoji}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          {streak > 0 && (
            <span className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground inline-flex items-center gap-1">
              <Flame className="h-3 w-3 text-primary" /> {streak} day{streak === 1 ? '' : 's'}
            </span>
          )}
          <span className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", viewMode === 'list' && "bg-accent")}
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", viewMode === 'gallery' && "bg-accent")}
            onClick={() => onViewModeChange('gallery')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 pb-24">
          {sectionLabel("Recent entries")}
          <div className={cn(viewMode === 'list' ? "space-y-1.5" : "space-y-1.5")}>
            {renderTodaySlot()}
            {pinnedNotes.length > 0 && (
              <div className={cn(viewMode === 'list' ? "space-y-1.5" : "grid grid-cols-2 gap-2")}>
                {pinnedNotes.map((note) => viewMode === 'list' ? renderListNote(note) : renderGalleryNote(note))}
              </div>
            )}
            <div className={cn(viewMode === 'list' ? "space-y-1.5" : "grid grid-cols-2 gap-2")}>
              {personalNotes.map((n) => viewMode === 'list' ? renderListNote(n) : renderGalleryNote(n))}
            </div>
            {personalNotes.length === 0 && !todayEntry && (
              <p className="text-center text-xs text-muted-foreground py-4">
                Your words stay private — only you can read them.
              </p>
            )}
          </div>

          {hasBibleSection && (
            <>
              {sectionLabel("Bible notes & highlights")}
              <div className="space-y-1.5">
                {order.map((key) => renderStackCard(key, groups.get(key)!))}
                {highlightGroups.map((g) => (
                  <button
                    key={`hl-${g.book}`}
                    onClick={() => onOpenHighlights?.(g.book)}
                    className="w-full text-left p-3.5 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors flex items-center gap-2.5"
                  >
                    <Highlighter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm truncate flex-1">{g.book}</span>
                    <span className="flex items-center gap-1">
                      {g.colors.slice(0, 4).map((c) => (
                        <span key={c} className={cn("w-2 h-2 rounded-full", HIGHLIGHT_DOT[c] ?? "bg-muted-foreground/40")} />
                      ))}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {g.count} verse{g.count === 1 ? '' : 's'}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* New entry */}
      <Button
        onClick={onNoteCreate}
        size="icon"
        variant="sacred"
        className="absolute bottom-5 right-4 h-12 w-12 rounded-full shadow-elevated"
        aria-label="New note"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
};
