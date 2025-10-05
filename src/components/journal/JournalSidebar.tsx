import { Plus, Folder, FolderPlus, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface JournalFolder {
  id: string;
  name: string;
  noteCount?: number;
}

interface JournalSidebarProps {
  folders: JournalFolder[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreate: () => void;
  onFolderDelete: (folderId: string) => void;
  onFolderRename: (folderId: string) => void;
}

export const JournalSidebar = ({
  folders,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderDelete,
  onFolderRename,
}: JournalSidebarProps) => {
  return (
    <div className="flex flex-col h-full border-r border-border bg-card/50">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">Folders</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onFolderCreate}
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All Notes */}
          <button
            onClick={() => onFolderSelect(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              selectedFolderId === null
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            )}
          >
            <Folder className="h-4 w-4" />
            <span>All Notes</span>
          </button>

          {/* Folders */}
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={cn(
                "flex items-center gap-2 rounded-lg transition-colors group",
                selectedFolderId === folder.id
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              )}
            >
              <button
                onClick={() => onFolderSelect(folder.id)}
                className="flex-1 flex items-center gap-2 px-3 py-2 text-sm"
              >
                <Folder className="h-4 w-4" />
                <span className="flex-1 text-left truncate">{folder.name}</span>
                {folder.noteCount !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {folder.noteCount}
                  </span>
                )}
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 mr-1"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onFolderRename(folder.id)}>
                    <Edit2 className="h-3 w-3 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onFolderDelete(folder.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
