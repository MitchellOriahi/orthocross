import { Plus, Search, Trash2, Pin, PinOff, LayoutGrid, List, Layers, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface JournalNote {
  id: string;
  title: string | null;
  content: string | null;
  updated_at: string;
  pinned: boolean;
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
}

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
}: JournalNotesListProps) => {
  const [expandedStacks, setExpandedStacks] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'personal' | 'bible'>('personal');

  const toggleStack = (key: string) => {
    setExpandedStacks((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Canonical list of Bible book names so we can classify a note by its title
  const BIBLE_BOOKS = new Set<string>([
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
  ]);

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
    // Also match titles like "Exodus", "Exodus 1:1", "1 Samuel 3:10", etc.
    for (const book of BIBLE_BOOKS) {
      if (t === book) return true;
      if (t.startsWith(book + " ") || t.startsWith(book + ":")) return true;
    }
    return false;
  };


  const getPreviewText = (note: JournalNote, titleOverride?: string) => {
    const title = titleOverride ?? (note.title || "Untitled");
    const content = note.content || "";
    
    // Extract first image from content if exists
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    const hasImage = !!imgMatch;
    const imageSrc = imgMatch ? imgMatch[1] : null;
    
    // Strip HTML tags for text preview, but don't show URLs
    const textContent = content
      .replace(/<img[^>]*>/g, '')
      .replace(/<audio[^>]*>.*?<\/audio>/g, '')
      .replace(/<video[^>]*>.*?<\/video>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .trim();
    
    const preview = textContent.substring(0, 100);
    return { title, preview, hasImage, imageSrc };
  };

  const pinnedNotes = notes.filter(n => n.pinned);
  const unpinnedNotes = notes.filter(n => !n.pinned);

  const renderListNote = (note: JournalNote, titleOverride?: string) => {
    const { title, preview } = getPreviewText(note, titleOverride);
    return (
      <div
        key={note.id}
        className={cn(
          "group relative p-3 rounded-lg transition-colors",
          selectedNoteId === note.id ? "bg-accent" : "hover:bg-accent/50"
        )}
      >
        <button
          onClick={() => onNoteSelect(note.id)}
          className="w-full text-left"
        >
          <div className="font-medium text-sm truncate mb-1 pr-16">
            {title}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2 mb-1">
            {preview}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
          </div>
        </button>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          "group relative rounded-lg overflow-hidden transition-all",
          selectedNoteId === note.id ? "ring-2 ring-primary" : "hover:shadow-md"
        )}
      >
        <button
          onClick={() => onNoteSelect(note.id)}
          className="w-full text-left bg-card"
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
                {preview || "Empty note"}
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="font-medium text-sm truncate mb-1">
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

  return (
    <div className="flex flex-col h-full border-r border-border bg-card/30">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notes</h3>
          <div className="flex items-center gap-1">
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
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className={cn("p-2", viewMode === 'gallery' && "grid grid-cols-2 gap-2")}>
          {notes.length === 0 ? (
            <>
              {viewMode === 'list' ? (
                <button
                  onClick={onNoteCreate}
                  className="w-full p-3 mb-2 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-accent/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">New Note</span>
                </button>
              ) : (
                <button
                  onClick={onNoteCreate}
                  className="rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-accent/50 transition-colors"
                >
                  <div className="aspect-[4/3] flex items-center justify-center">
                    <div className="text-center">
                      <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">New Note</span>
                    </div>
                  </div>
                </button>
              )}
              <div className={cn("text-center py-8 text-sm text-muted-foreground", viewMode === 'gallery' && "col-span-2")}>
                Click above to create your first note
              </div>
            </>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <div className={cn("mb-4", viewMode === 'gallery' && "col-span-2")}>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">Journal Cover</h4>
                  <div className={cn(viewMode === 'list' ? "space-y-1" : "grid grid-cols-2 gap-2")}>
                    {pinnedNotes.map((note) => viewMode === 'list' ? renderListNote(note) : renderGalleryNote(note))}
                  </div>
                </div>
              )}
              
              {/* New Note Button below Journal Cover */}
              <div className={cn(viewMode === 'gallery' && "col-span-2", "mb-4")}>
                {viewMode === 'list' ? (
                  <button
                    onClick={onNoteCreate}
                    className="w-full p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-accent/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">New Note</span>
                  </button>
                ) : (
                  <button
                    onClick={onNoteCreate}
                    className="rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-accent/50 transition-colors"
                  >
                    <div className="aspect-[4/3] flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">New Note</span>
                      </div>
                    </div>
                  </button>
                )}
              </div>
              
              {unpinnedNotes.length > 0 && (() => {
                // Extract chapter/verse from a note's heading (e.g. "Genesis 1:1")
                const getRef = (n: JournalNote): { ch: number; vs: number } => {
                  const src = `${n.title || ""} ${n.content || ""}`;
                  const m = src.match(/(\d+)\s*:\s*(\d+)/);
                  return m ? { ch: parseInt(m[1], 10), vs: parseInt(m[2], 10) } : { ch: -1, vs: -1 };
                };

                // A note is a "Bible note" if its content contains a verse reference
                const isBibleNote = (n: JournalNote) => getVerseRef(n) !== null || isBibleBookTitle(n);
                const bibleNotes = unpinnedNotes.filter(isBibleNote);
                const personalNotes = unpinnedNotes.filter((n) => !isBibleNote(n));

                // Derive the canonical book name from a Bible note's title,
                // so "Exodus 1:1" still groups under "Exodus".
                const getBookKey = (n: JournalNote): string => {
                  const raw = (n.title || "Untitled").trim();
                  for (const book of BIBLE_BOOKS) {
                    if (raw === book) return book;
                    if (raw.startsWith(book + " ") || raw.startsWith(book + ":")) return book;
                  }
                  // Fall back to verse ref in content (e.g. "Exodus 1:1") then strip the numbers
                  const ref = getVerseRef(n);
                  if (ref) {
                    const m = ref.match(/^([1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)?)\s+\d+/);
                    if (m) return m[1].trim();
                  }
                  return raw;
                };

                // Group Bible notes by book name to create stacks
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
                // Sort each group from furthest within the book to earliest
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
                          "w-full text-left p-3 rounded-lg transition-colors relative",
                          "hover:bg-accent/50 bg-card border border-border",
                          "shadow-[0_4px_0_-2px_hsl(var(--border)),0_8px_0_-4px_hsl(var(--border))]"
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
                        <div className={cn("mt-2 space-y-1", viewMode === 'list' ? "ml-4 pl-3 border-l-2 border-border" : "")}>
                          {items.map((n) => {
                            const ref = getVerseRef(n) ?? (n.title || "Untitled");
                            return viewMode === 'list' ? renderListNote(n, ref) : renderGalleryNote(n, ref);
                          })}
                        </div>
                      )}
                    </div>
                  );
                };

                const renderPersonal = () => (
                  <div className={cn(viewMode === 'list' ? "space-y-1" : "grid grid-cols-2 gap-2")}>
                    {personalNotes.length > 0 ? (
                      personalNotes.map((n) => viewMode === 'list' ? renderListNote(n) : renderGalleryNote(n))
                    ) : (
                      <div className={cn("text-center py-8 text-sm text-muted-foreground", viewMode === 'gallery' && "col-span-2")}>
                        No personal notes yet
                      </div>
                    )}
                  </div>
                );

                const renderBible = () => (
                  <div className="space-y-2">
                    {bibleNotes.length > 0 ? (
                      order.map((key) => {
                        const items = groups.get(key)!;
                        return renderStackCard(key, items);
                      })
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No Bible notes yet
                      </div>
                    )}
                  </div>
                );

                return (
                  <div className={cn(viewMode === 'gallery' && "col-span-2")}>
                    {/* Tab slider */}
                    <div className="relative grid grid-cols-2 p-1 mb-3 bg-muted rounded-lg">
                      <div
                        className={cn(
                          "absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-background shadow-sm transition-transform duration-300 ease-out",
                          activeTab === 'bible' ? "translate-x-full" : "translate-x-0"
                        )}
                      />
                      <button
                        onClick={() => setActiveTab('personal')}
                        className={cn(
                          "relative z-10 text-xs font-medium py-1.5 rounded-md transition-colors",
                          activeTab === 'personal' ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        Personal Notes
                      </button>
                      <button
                        onClick={() => setActiveTab('bible')}
                        className={cn(
                          "relative z-10 text-xs font-medium py-1.5 rounded-md transition-colors",
                          activeTab === 'bible' ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        Bible Notes
                      </button>
                    </div>

                    {/* Sliding pane */}
                    <div className="overflow-hidden">
                      <div
                        className="flex transition-transform duration-300 ease-out"
                        style={{ transform: activeTab === 'bible' ? 'translateX(-100%)' : 'translateX(0)' }}
                      >
                        <div className="w-full shrink-0 pr-2">{renderPersonal()}</div>
                        <div className="w-full shrink-0 pl-2">{renderBible()}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
