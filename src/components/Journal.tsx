import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JournalSidebar } from "./journal/JournalSidebar";
import { JournalEditor } from "./journal/JournalEditor";

interface JournalEntry {
  id: string;
  title: string | null;
  content: string | null;
  folder_id: string | null;
  updated_at: string;
  user_id: string;
}

interface JournalFolder {
  id: string;
  name: string;
  user_id: string;
}

export const Journal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [folders, setFolders] = useState<JournalFolder[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadFolders();
      loadEntries();
    }
  }, [user]);

  const loadFolders = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('journal_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error loading folders:', error);
      return;
    }
    setFolders(data || []);
  };

  const loadEntries = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading entries:', error);
      return;
    }
    setEntries(data || []);
    if (data && data.length > 0 && !selectedEntry) {
      setSelectedEntry(data[0].id);
    }
  };

  const handleCreateFolder = async (name: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('journal_folders')
      .insert({ user_id: user.id, name });

    if (error) {
      toast({ title: "Error creating folder", variant: "destructive" });
      return;
    }
    loadFolders();
  };

  const handleCreateEntry = async (folderId: string | null) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ 
        user_id: user.id, 
        folder_id: folderId,
        title: "",
        content: ""
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating note", variant: "destructive" });
      return;
    }
    loadEntries();
    if (data) setSelectedEntry(data.id);
  };

  const handleUpdateEntry = async (entryId: string, title: string, content: string) => {
    await supabase
      .from('journal_entries')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', entryId);
    
    setEntries(prev => 
      prev.map(e => e.id === entryId ? { ...e, title, content } : e)
    );
  };

  const handleDeleteEntry = async (entryId: string) => {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      toast({ title: "Error deleting note", variant: "destructive" });
      return;
    }
    loadEntries();
    setSelectedEntry(null);
  };

  const handleDeleteFolder = async (folderId: string) => {
    const { error } = await supabase
      .from('journal_folders')
      .delete()
      .eq('id', folderId);

    if (error) {
      toast({ title: "Error deleting folder", variant: "destructive" });
      return;
    }
    loadFolders();
    loadEntries();
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    const { error } = await supabase
      .from('journal_folders')
      .update({ name: newName })
      .eq('id', folderId);

    if (error) {
      toast({ title: "Error renaming folder", variant: "destructive" });
      return;
    }
    loadFolders();
  };

  const displayedEntries = selectedFolder === null 
    ? entries 
    : entries.filter(e => e.folder_id === selectedFolder);

  const currentEntry = entries.find(e => e.id === selectedEntry);

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      <JournalSidebar
        folders={folders}
        entries={displayedEntries}
        selectedEntry={selectedEntry}
        selectedFolder={selectedFolder}
        onSelectEntry={setSelectedEntry}
        onSelectFolder={setSelectedFolder}
        onCreateFolder={handleCreateFolder}
        onCreateEntry={handleCreateEntry}
        onDeleteFolder={handleDeleteFolder}
        onDeleteEntry={handleDeleteEntry}
        onRenameFolder={handleRenameFolder}
      />
      {currentEntry ? (
        <JournalEditor
          entryId={currentEntry.id}
          title={currentEntry.title}
          content={currentEntry.content}
          onUpdate={handleUpdateEntry}
          onDelete={handleDeleteEntry}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a note or create a new one
        </div>
      )}
    </div>
  );
};
