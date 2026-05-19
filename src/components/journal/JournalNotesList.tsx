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

  const toggleStack = (key: string) => {
    setExpandedStacks((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const getPreviewText = (note: JournalNote) => {
    const title = note.title || "Untitled";
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

  const renderListNote = (note: JournalNote) => {
    const { title, preview } = getPreviewText(note);
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

  const renderGalleryNote = (note: JournalNote) => {
    const { title, preview, hasImage, imageSrc } = getPreviewText(note);
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
                // Group unpinned notes by title to create stacks
                const groups = new Map<string, JournalNote[]>();
                const order: string[] = [];
                for (const n of unpinnedNotes) {
                  const key = (n.title || "Untitled").trim();
                  if (!groups.has(key)) {
                    groups.set(key, []);
                    order.push(key);
                  }
                  groups.get(key)!.push(n);
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
                        <div className="mt-2 ml-4 pl-3 border-l-2 border-border space-y-1">
                          {items.map((n) => viewMode === 'list' ? renderListNote(n) : renderGalleryNote(n))}
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <div className={cn(viewMode === 'gallery' && "col-span-2")}>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">All Notes</h4>
                    <div className="space-y-2">
                      {order.map((key) => {
                        const items = groups.get(key)!;
                        if (items.length === 1) {
                          const n = items[0];
                          return viewMode === 'list' ? renderListNote(n) : renderGalleryNote(n);
                        }
                        return renderStackCard(key, items);
                      })}
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
