import { FolderInput, Folder, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface MoveNoteMenuProps {
  folders: { id: string; name: string }[];
  folderId: string | null;
  onMove: (folderId: string | null) => void;
}

export function MoveNoteMenu({ folders, folderId, onMove }: MoveNoteMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label="Move note" title="Move note">
          <FolderInput className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        {[{ id: null, name: 'Notes' }, ...folders].map(folder => (
          <DropdownMenuItem key={folder.id ?? 'general'} disabled={folder.id === folderId} onClick={() => onMove(folder.id)}>
            <Folder className="h-4 w-4 mr-2 shrink-0" />
            <span className="flex-1" translate={folder.id ? 'no' : undefined}>{folder.name}</span>
            {folder.id === folderId && <Check className="h-4 w-4 ml-2 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}