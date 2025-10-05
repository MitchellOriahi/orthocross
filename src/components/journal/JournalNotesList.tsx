import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface JournalNote {
  id: string;
  title: string | null;
  content: string | null;
  updated_at: string;
}

interface JournalNotesListProps {
  notes: JournalNote[];
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  onNoteCreate: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const JournalNotesList = ({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNoteCreate,
  searchQuery,
  onSearchChange,
}: JournalNotesListProps) => {
  const getPreviewText = (note: JournalNote) => {
    const title = note.title || "Untitled";
    const content = note.content || "";
    const preview = content.substring(0, 100);
    return { title, preview };
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-card/30">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notes</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onNoteCreate}
          >
            <Plus className="h-4 w-4" />
          </Button>
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
        <div className="p-2 space-y-1">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No notes yet
            </div>
          ) : (
            notes.map((note) => {
              const { title, preview } = getPreviewText(note);
              return (
                <button
                  key={note.id}
                  onClick={() => onNoteSelect(note.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    selectedNoteId === note.id
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  )}
                >
                  <div className="font-medium text-sm truncate mb-1">
                    {title}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mb-1">
                    {preview}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.updated_at), {
                      addSuffix: true,
                    })}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
