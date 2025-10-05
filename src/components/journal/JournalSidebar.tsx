import { useState } from "react";
import { Folder, Plus, ChevronRight, FileText, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface JournalEntry {
  id: string;
  title: string | null;
  content: string | null;
  folder_id: string | null;
  updated_at: string;
}

interface JournalFolder {
  id: string;
  name: string;
}

interface JournalSidebarProps {
  folders: JournalFolder[];
  entries: JournalEntry[];
  selectedEntry: string | null;
  selectedFolder: string | null;
  onSelectEntry: (entryId: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onCreateEntry: (folderId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
}

export const JournalSidebar = ({
  folders,
  entries,
  selectedEntry,
  selectedFolder,
  onSelectEntry,
  onSelectFolder,
  onCreateFolder,
  onCreateEntry,
  onDeleteFolder,
  onDeleteEntry,
  onRenameFolder,
}: JournalSidebarProps) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreatingFolder(false);
    }
  };

  const handleRenameFolder = (folderId: string) => {
    if (editName.trim()) {
      onRenameFolder(folderId, editName.trim());
      setEditingFolder(null);
      setEditName("");
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const unfiledEntries = entries.filter(e => !e.folder_id);

  const getEntryTitle = (entry: JournalEntry) => {
    if (entry.title) return entry.title;
    if (entry.content) {
      const firstLine = entry.content.split('\n')[0];
      return firstLine.slice(0, 30) + (firstLine.length > 30 ? '...' : '');
    }
    return 'Untitled Note';
  };

  return (
    <div className="w-64 border-r border-border bg-background flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Folders</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsCreatingFolder(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {isCreatingFolder && (
          <div className="flex gap-1">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder="Folder name"
              className="h-7 text-xs"
              autoFocus
            />
            <Button size="sm" onClick={handleCreateFolder} className="h-7">
              Add
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* All Notes */}
          <button
            onClick={() => onSelectFolder(null)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent ${
              selectedFolder === null ? 'bg-accent' : ''
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>All Notes</span>
            <span className="ml-auto text-xs text-muted-foreground">{entries.length}</span>
          </button>

          {/* Folders */}
          {folders.map((folder) => (
            <div key={folder.id}>
              <div className="flex items-center gap-1 group">
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="p-0.5 hover:bg-accent rounded"
                >
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      expandedFolders.has(folder.id) ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {editingFolder === folder.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameFolder(folder.id);
                      if (e.key === 'Escape') setEditingFolder(null);
                    }}
                    onBlur={() => handleRenameFolder(folder.id)}
                    className="h-6 text-xs flex-1"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => onSelectFolder(folder.id)}
                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent ${
                      selectedFolder === folder.id ? 'bg-accent' : ''
                    }`}
                  >
                    <Folder className="h-4 w-4" />
                    <span className="flex-1 text-left">{folder.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {entries.filter(e => e.folder_id === folder.id).length}
                    </span>
                  </button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingFolder(folder.id);
                        setEditName(folder.name);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteFolder(folder.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {expandedFolders.has(folder.id) && (
                <div className="ml-6 mt-1 space-y-1">
                  {entries
                    .filter(e => e.folder_id === folder.id)
                    .map(entry => (
                      <button
                        key={entry.id}
                        onClick={() => onSelectEntry(entry.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent ${
                          selectedEntry === entry.id ? 'bg-accent' : ''
                        }`}
                      >
                        {getEntryTitle(entry)}
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}

          {/* Unfiled notes */}
          {unfiledEntries.length > 0 && (
            <div className="mt-4">
              <div className="px-2 py-1 text-xs text-muted-foreground">Unfiled</div>
              {unfiledEntries.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => onSelectEntry(entry.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent ${
                    selectedEntry === entry.id ? 'bg-accent' : ''
                  }`}
                >
                  {getEntryTitle(entry)}
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onCreateEntry(selectedFolder)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>
    </div>
  );
};
