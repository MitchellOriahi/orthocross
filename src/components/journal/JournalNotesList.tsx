import { Plus, Search, Trash2, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  viewMode: "list" | "pinned";
  onViewModeChange: (mode: "list" | "pinned") => void;
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
  const getPreviewText = (note: JournalNote) => {
    const title = note.title || "Untitled";
    const content = note.content || "";
    const preview = content.substring(0, 100);
    return { title, preview };
  };

  const pinnedNotes = notes.filter(n => n.pinned);
  const unpinnedNotes = notes.filter(n => !n.pinned);

  const renderNoteCard = (note: JournalNote, showTimestamp: boolean = true) => {
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
          {showTimestamp && (
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
            </div>
          )}
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
        <div className="flex items-center space-x-2">
          <Switch
            id="view-mode"
            checked={viewMode === "pinned"}
            onCheckedChange={(checked) => onViewModeChange(checked ? "pinned" : "list")}
          />
          <Label htmlFor="view-mode" className="text-xs">Show pinned section</Label>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No notes yet
            </div>
          ) : viewMode === "pinned" ? (
            <>
              {pinnedNotes.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">Pinned</h4>
                  <div className="space-y-1">
                    {pinnedNotes.map((note) => renderNoteCard(note, false))}
                  </div>
                </div>
              )}
              {unpinnedNotes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">Notes</h4>
                  <div className="space-y-1">
                    {unpinnedNotes.map((note) => renderNoteCard(note, true))}
                  </div>
                </div>
              )}
            </>
          ) : (
            notes.map((note) => renderNoteCard(note, true))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
