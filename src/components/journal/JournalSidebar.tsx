import { useState } from 'react';
import { Folder, FolderPlus, MoreVertical, Trash2, Edit2, ChevronRight, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ALL_NOTES, defaultNotesFolder, isDefaultNotesFolder } from './folderScope';
import { folderSiblings, TreeFolder } from './folderTree';

interface JournalFolder extends TreeFolder { noteCount?: number; is_default?: boolean | null; }
interface JournalSidebarProps {
  folders: JournalFolder[];
  selectedFolderId: string | null;
  totalNoteCount: number;
  editing: boolean;
  reordering: boolean;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreate: (parentId?: string | null) => void;
  onFolderDelete: (folderId: string) => void;
  onFolderRename: (folderId: string) => void;
  onFolderReorder: (folderId: string, direction: -1 | 1) => void;
}

export const JournalSidebar = ({ folders, selectedFolderId, totalNoteCount, editing, reordering, onFolderSelect, onFolderCreate, onFolderDelete, onFolderRename, onFolderReorder }: JournalSidebarProps) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const reveal = (id: string) => setExpanded(previous => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const hasChildren = (id: string) => folders.some(child => child.parent_id === id);
  const isOpen = (id: string) => expanded.has(id);
  const row = (folder: JournalFolder, siblings: JournalFolder[], index: number) => {
    const isDefault = isDefaultNotesFolder(folder);
    return <div className={cn("flex items-center gap-1 rounded-md group", selectedFolderId === folder.id ? "bg-accent" : "hover:bg-accent/50")}>
      <Button variant="ghost" onClick={() => onFolderSelect(folder.id)} className="flex-1 min-w-0 h-auto justify-start gap-2 px-3 py-2 text-sm">
        <Folder className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-start truncate" translate={isDefault ? undefined : 'no'}>{folder.name}</span>
        <span className="text-xs text-muted-foreground shrink-0">{folder.noteCount ?? 0}</span>
      </Button>
      {hasChildren(folder.id) && <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`${isOpen(folder.id) ? 'Collapse' : 'Expand'} folder: ${folder.name}`} aria-expanded={isOpen(folder.id)} onClick={() => reveal(folder.id)}>
        {isOpen(folder.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>}
      {editing ? <div className="flex shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={reordering || index === 0} onClick={() => onFolderReorder(folder.id, -1)} aria-label={`Move up: ${folder.name}`} title="Move up"><ArrowUp className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={reordering || index === siblings.length - 1} onClick={() => onFolderReorder(folder.id, 1)} aria-label={`Move down: ${folder.name}`} title="Move down"><ArrowDown className="h-4 w-4" /></Button>
      </div> : <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Folder options: ${folder.name}`}><MoreVertical className="h-3 w-3" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { setExpanded(previous => new Set(previous).add(folder.id)); onFolderCreate(folder.id); }}><FolderPlus className="h-3 w-3 mr-2" />Subfolder</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFolderRename(folder.id)}><Edit2 className="h-3 w-3 mr-2" />Rename</DropdownMenuItem>
          {!isDefault && <DropdownMenuItem onClick={() => onFolderDelete(folder.id)} className="text-destructive"><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>}
    </div>;
  };
  const renderFolders = (parentId: string | null, ancestors: string[] = []): React.ReactNode => {
    const siblings = folderSiblings(folders, parentId).filter(folder => !ancestors.includes(folder.id) && !isDefaultNotesFolder(folder));
    return siblings.map((folder, index) => <div key={folder.id}>
      {row(folder, siblings, index)}
      {hasChildren(folder.id) && isOpen(folder.id) && <div className="ms-3 border-s border-border ps-1">{renderFolders(folder.id, [...ancestors, folder.id])}</div>}
    </div>);
  };
  const primary = defaultNotesFolder(folders);
  return <div className="flex flex-col h-full min-h-0 bg-card/50">
    <ScrollArea className="flex-1 min-h-0"><div className="p-2 space-y-1">
      <Button variant="ghost" onClick={() => onFolderSelect(ALL_NOTES)} className={cn("w-full justify-start gap-2 px-3", selectedFolderId === ALL_NOTES && "bg-accent text-accent-foreground")}>
        <Folder className="h-4 w-4 shrink-0" /><span className="flex-1 text-start">All Notes</span><span className="text-xs text-muted-foreground">{totalNoteCount}</span>
      </Button>
      {primary && <div className="ms-3 border-s border-border ps-1">
        {row(primary, [primary], 0)}
        {hasChildren(primary.id) && isOpen(primary.id) && <div className="ms-3 border-s border-border ps-1">{renderFolders(primary.id, [primary.id])}</div>}
      </div>}
      {renderFolders(null)}
    </div></ScrollArea>
  </div>;
};
