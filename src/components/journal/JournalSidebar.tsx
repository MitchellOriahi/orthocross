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
import { ALL_NOTES } from './folderScope';

interface JournalFolder {
  id: string;
  name: string;
  noteCount?: number;
}

interface JournalSidebarProps {
  folders: JournalFolder[];
  selectedFolderId: string | null;
  generalNoteCount: number;
  totalNoteCount: number;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreate: () => void;
  onFolderDelete: (folderId: string) => void;
  onFolderRename: (folderId: string) => void;
}

export const JournalSidebar = ({
  folders,
  selectedFolderId,
  generalNoteCount,
  totalNoteCount,
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
          aria-label="New folder"
          title="New folder"
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <Button
            variant="ghost"
            onClick={() => onFolderSelect(ALL_NOTES)}
            className={cn("w-full justify-start gap-2 px-3", selectedFolderId === ALL_NOTES && "bg-accent text-accent-foreground")}
          >
            <Folder className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-start">All Notes</span>
            <span className="text-xs text-muted-foreground">{totalNoteCount}</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => onFolderSelect(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              selectedFolderId === null
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            )}
          >
            <Folder className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-start">Notes</span>
            <span className="text-xs text-muted-foreground">{generalNoteCount}</span>
          </Button>

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
              <Button
                variant="ghost"
                onClick={() => onFolderSelect(folder.id)}
                className="flex-1 min-w-0 h-auto justify-start gap-2 px-3 py-2 text-sm"
              >
                <Folder className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-start truncate" translate="no">{folder.name}</span>
                {folder.noteCount !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {folder.noteCount}
                  </span>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 mr-1"
                    aria-label={`Folder options: ${folder.name}`}
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
