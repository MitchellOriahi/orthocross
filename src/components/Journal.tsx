import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JournalSidebar } from "./journal/JournalSidebar";
import { JournalNotesList } from "./journal/JournalNotesList";
import { JournalEditor } from "./journal/JournalEditor";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Extended types that match the actual database schema
interface JournalNote {
  id: string;
  title: string | null;
  content: string | null;
  folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface JournalFolder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const Journal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [folders, setFolders] = useState<JournalFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentContent, setCurrentContent] = useState("");

  // Load folders and notes
  useEffect(() => {
    if (!user) return;

    const loadFolders = async () => {
      const { data } = await (supabase as any)
        .from('journal_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (data) setFolders(data);
    };

    const loadNotes = async () => {
      const query = (supabase as any)
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id);
      
      if (selectedFolderId) {
        const { data } = await query.eq('folder_id', selectedFolderId).order('updated_at', { ascending: false });
        if (data) setNotes(data);
      } else {
        const { data } = await query.order('updated_at', { ascending: false });
        if (data) setNotes(data);
      }
    };

    loadFolders();
    loadNotes();
  }, [user, selectedFolderId]);

  // Load selected note
  useEffect(() => {
    if (!selectedNoteId) return;
    
    const note = notes.find(n => n.id === selectedNoteId);
    if (note) {
      setCurrentTitle(note.title || "");
      setCurrentContent(note.content || "");
    }
  }, [selectedNoteId, notes]);

  // Auto-save
  useEffect(() => {
    if (!user || !selectedNoteId || isSaving) return;

    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      try {
        await (supabase as any)
          .from('journal_entries')
          .update({
            title: currentTitle || null,
            content: currentContent || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedNoteId);
        
        // Refresh notes list
        const { data } = await (supabase as any)
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        
        if (data) setNotes(data);
      } catch (error) {
        console.error('Error saving:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [currentTitle, currentContent, selectedNoteId, user, isSaving]);

  const handleNoteCreate = async () => {
    if (!user) return;
    
    const { data, error } = await (supabase as any)
      .from('journal_entries')
      .insert({
        user_id: user.id,
        folder_id: selectedFolderId,
        title: "New Note",
        content: ""
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: "Error creating note", variant: "destructive" });
      return;
    }
    
    if (data) {
      setNotes([data, ...notes]);
      setSelectedNoteId(data.id);
      setIsFullScreen(true);
    }
  };

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId);
    setIsFullScreen(true);
  };

  const handleFolderCreate = async () => {
    if (!user) return;
    
    const folderName = prompt("Enter folder name:");
    if (!folderName) return;
    
    const { data, error } = await (supabase as any)
      .from('journal_folders')
      .insert({
        user_id: user.id,
        name: folderName
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: "Error creating folder", variant: "destructive" });
      return;
    }
    
    if (data) {
      setFolders([...folders, data]);
    }
  };

  const handleFolderDelete = async (folderId: string) => {
    if (!confirm("Delete this folder and all its notes?")) return;
    
    await (supabase as any).from('journal_folders').delete().eq('id', folderId);
    setFolders(folders.filter(f => f.id !== folderId));
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
    }
  };

  const handleFolderRename = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const newName = prompt("Enter new folder name:", folder.name);
    if (!newName) return;
    
    await (supabase as any)
      .from('journal_folders')
      .update({ name: newName })
      .eq('id', folderId);
    
    setFolders(folders.map(f => f.id === folderId ? { ...f, name: newName } : f));
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      (note.title?.toLowerCase().includes(searchLower)) ||
      (note.content?.toLowerCase().includes(searchLower))
    );
  });

  const handleClose = () => {
    setIsFullScreen(false);
    setSelectedNoteId(null);
  };

  return (
    <>
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => !isFullScreen && handleNoteCreate()}
      >
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium mb-1">Journal</p>
            <p className="text-sm">Click to start writing...</p>
          </div>
        </div>
      </Card>

      <Sheet open={isFullScreen} onOpenChange={setIsFullScreen}>
        <SheetContent side="bottom" className="h-screen w-screen p-0 max-w-none">
          <div className="h-full flex flex-col">
            <div className="border-b border-border p-2 flex items-center justify-between bg-card">
              <h2 className="text-lg font-semibold px-2">Journal</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              <div className="w-48">
                <JournalSidebar
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={setSelectedFolderId}
                  onFolderCreate={handleFolderCreate}
                  onFolderDelete={handleFolderDelete}
                  onFolderRename={handleFolderRename}
                />
              </div>
              
              <div className="w-64">
                <JournalNotesList
                  notes={filteredNotes}
                  selectedNoteId={selectedNoteId}
                  onNoteSelect={handleNoteSelect}
                  onNoteCreate={handleNoteCreate}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>
              
              <div className="flex-1">
                {selectedNoteId ? (
                  <JournalEditor
                    title={currentTitle}
                    content={currentContent}
                    onTitleChange={setCurrentTitle}
                    onContentChange={setCurrentContent}
                    isSaving={isSaving}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a note or create a new one
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
