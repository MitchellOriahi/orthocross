import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JournalSidebar } from "./journal/JournalSidebar";
import { JournalNotesList } from "./journal/JournalNotesList";
import { JournalEditor } from "./journal/JournalEditor";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Menu, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Extended types that match the actual database schema
interface JournalNote {
  id: string;
  title: string | null;
  content: string | null;
  folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  pinned: boolean;
  pinned_media_url: string | null;
  pinned_media_type: string | null;
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
  const isMobile = useIsMobile();
  
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [folders, setFolders] = useState<JournalFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotesList, setShowNotesList] = useState(true);
  
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentContent, setCurrentContent] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  const [isNewUnmodifiedNote, setIsNewUnmodifiedNote] = useState(false);

  // Load view preference
  useEffect(() => {
    if (!user) return;

    const loadViewPreference = async () => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('journal_view_mode')
        .eq('id', user.id)
        .single();
      
      if (data?.journal_view_mode) {
        setViewMode(data.journal_view_mode);
      }
    };

    loadViewPreference();
  }, [user]);

  // Clear new note flag when user makes any edits
  useEffect(() => {
    if (isNewUnmodifiedNote && (currentTitle !== "New Note" || currentContent !== "")) {
      setIsNewUnmodifiedNote(false);
    }
  }, [currentTitle, currentContent, isNewUnmodifiedNote]);

  // Delete unmodified notes when closing the sheet
  useEffect(() => {
    const deleteUnmodifiedNote = async () => {
      console.log('Delete check triggered', { isFullScreen, isNewUnmodifiedNote, selectedNoteId });
      
      if (!isFullScreen && isNewUnmodifiedNote && selectedNoteId) {
        const note = notes.find(n => n.id === selectedNoteId);
        console.log('Found note to potentially delete:', note);
        
        if (note && (note.title === "New Note" || !note.title) && (!note.content || note.content === "")) {
          console.log('Deleting unmodified note:', note.id);
          await (supabase as any).from('journal_entries').delete().eq('id', selectedNoteId);
          setNotes(notes.filter(n => n.id !== selectedNoteId));
          setSelectedNoteId(null);
          setIsNewUnmodifiedNote(false);
        } else {
          console.log('Note was modified, not deleting');
        }
      }
    };

    deleteUnmodifiedNote();
  }, [isFullScreen, isNewUnmodifiedNote, selectedNoteId, notes]);

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

  // Auto-save with debounce
  useEffect(() => {
    if (!user || !selectedNoteId) return;

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
        
        // Update only the current note in the list instead of refreshing everything
        setNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === selectedNoteId 
              ? { ...note, title: currentTitle, content: currentContent, updated_at: new Date().toISOString() }
              : note
          )
        );
      } catch (error) {
        console.error('Error saving:', error);
      } finally {
        setTimeout(() => setIsSaving(false), 300);
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [currentTitle, currentContent, selectedNoteId, user]);

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
      setIsNewUnmodifiedNote(true);
      if (isMobile) {
        setShowNotesList(false);
      }
    }
  };

  const handleNoteSelect = async (noteId: string) => {
    // Check if we need to delete the current unmodified note before switching
    if (isNewUnmodifiedNote && selectedNoteId && selectedNoteId !== noteId) {
      const note = notes.find(n => n.id === selectedNoteId);
      if (note && (note.title === "New Note" || !note.title) && (!note.content || note.content === "")) {
        await (supabase as any).from('journal_entries').delete().eq('id', selectedNoteId);
        setNotes(notes.filter(n => n.id !== selectedNoteId));
      }
    }
    
    setSelectedNoteId(noteId);
    setIsFullScreen(true);
    setIsNewUnmodifiedNote(false);
    if (isMobile) {
      setShowNotesList(false);
    }
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

  const handleNoteDelete = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    
    await (supabase as any).from('journal_entries').delete().eq('id', noteId);
    setNotes(notes.filter(n => n.id !== noteId));
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
  };

  const handleNotePin = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // If pinning, unpin all other notes first
    if (!note.pinned) {
      const currentlyPinnedNote = notes.find(n => n.pinned);
      if (currentlyPinnedNote) {
        await (supabase as any)
          .from('journal_entries')
          .update({ pinned: false })
          .eq('id', currentlyPinnedNote.id);
      }
    }

    await (supabase as any)
      .from('journal_entries')
      .update({ pinned: !note.pinned })
      .eq('id', noteId);

    setNotes(notes.map(n => 
      n.id === noteId ? { ...n, pinned: !n.pinned } : { ...n, pinned: false }
    ));

    toast({ 
      title: !note.pinned ? "Note pinned as journal cover" : "Note unpinned",
      duration: 3000,
    });
  };

  const handleViewModeChange = async (newMode: 'list' | 'gallery') => {
    setViewMode(newMode);
    if (!user) return;
    
    await (supabase as any)
      .from('profiles')
      .update({ journal_view_mode: newMode })
      .eq('id', user.id);
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
    setShowSidebar(false);
    setShowNotesList(true);
  };

  const pinnedNote = notes.find(n => n.pinned);
  const mostRecentNote = notes.length > 0 ? notes[0] : null;
  const displayNote = pinnedNote || mostRecentNote;
  const isPinned = displayNote?.pinned || false;
  const pinnedMediaUrl = displayNote?.pinned_media_url;
  const pinnedMediaType = displayNote?.pinned_media_type;
  
  // Extract media and text from note content
  const getContentPreview = (note: typeof displayNote) => {
    if (!note || !note.content) return { text: '', imageUrl: null, hasAudio: false };
    
    const content = note.content;
    
    // Extract first image URL
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;
    
    // Check for audio
    const hasAudio = content.includes('<audio');
    
    // Strip all HTML and URLs to get clean text
    const textContent = content
      .replace(/<img[^>]*>/g, '')
      .replace(/<audio[^>]*>.*?<\/audio>/g, '')
      .replace(/<video[^>]*>.*?<\/video>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .trim();
    
    return { text: textContent, imageUrl, hasAudio };
  };
  
  const contentPreview = displayNote ? getContentPreview(displayNote) : { text: '', imageUrl: null, hasAudio: false };
  const hasContent = displayNote && (displayNote.title || contentPreview.text || contentPreview.imageUrl || pinnedMediaUrl);

  return (
    <>
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => !isFullScreen && setIsFullScreen(true)}
      >
        <div className={pinnedMediaUrl && pinnedMediaType ? "h-[300px] overflow-hidden" : "h-[200px] overflow-hidden"}>
          {hasContent ? (
            <>
              {/* Show pinned media if available, taking full height */}
              {pinnedMediaUrl && pinnedMediaType ? (
                <div 
                  className="h-full w-full overflow-hidden bg-muted flex items-center justify-center relative group"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pinnedMediaType === 'video' || pinnedMediaType === 'audio') {
                      const mediaElement = e.currentTarget.querySelector('video, audio') as HTMLMediaElement;
                      if (mediaElement) {
                        if (mediaElement.paused) {
                          mediaElement.play();
                        } else {
                          mediaElement.pause();
                        }
                      }
                    }
                  }}
                >
                  {pinnedMediaType === 'image' || pinnedMediaType === 'drawing' ? (
                    <img 
                      src={pinnedMediaUrl} 
                      alt="Pinned media" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : pinnedMediaType === 'video' ? (
                    <>
                      <video 
                        src={pinnedMediaUrl} 
                        className="max-w-full max-h-full object-contain"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center">
                          <Play className="h-8 w-8 text-primary ml-1" />
                        </div>
                      </div>
                    </>
                  ) : pinnedMediaType === 'audio' ? (
                    <>
                      <div className="flex items-center justify-center w-full h-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                      </div>
                      <audio src={pinnedMediaUrl} className="hidden" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center">
                          <Play className="h-8 w-8 text-primary ml-1" />
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : contentPreview.imageUrl ? (
                <div className="h-full flex flex-col">
                  <div className="flex-shrink-0 h-[120px] overflow-hidden">
                    <img 
                      src={contentPreview.imageUrl} 
                      alt="Note preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex-1">
                    <h3 className="font-semibold text-sm truncate mb-1">
                      {displayNote.title || "Untitled"}
                    </h3>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {contentPreview.text || ""}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate flex-1">
                      {displayNote.title || "Untitled"}
                    </h3>
                    {!isPinned && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDistanceToNow(new Date(displayNote.updated_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-6 leading-relaxed">
                    {contentPreview.text || ""}
                  </div>
                  {!isPinned && contentPreview.hasAudio && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                      Voice note included
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center p-4">
                <p className="text-lg font-medium mb-1">Journal</p>
                <p className="text-sm">Click to start writing...</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Sheet open={isFullScreen} onOpenChange={setIsFullScreen}>
        <SheetContent side="bottom" className="h-screen w-screen p-0 max-w-none">
          <SheetTitle className="sr-only">Journal Editor</SheetTitle>
          <div className="h-full flex flex-col">
            <div className="border-b border-border p-2 flex items-center bg-card">
              {isMobile && selectedNoteId && !showNotesList && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotesList(true)}
                  className="mr-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              {isMobile && !showSidebar && showNotesList && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(true)}
                  className="mr-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h2 className="text-lg font-semibold px-2">Journal</h2>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Desktop: Always show sidebar */}
              {/* Mobile: Show sidebar only when toggled */}
              {(!isMobile || showSidebar) && (
                <div className={`${isMobile ? 'absolute inset-0 z-50 bg-background' : 'w-48'}`}>
                  {isMobile && (
                    <div className="p-2 border-b border-border flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSidebar(false)}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <h3 className="text-lg font-semibold ml-2">Folders</h3>
                    </div>
                  )}
                  <JournalSidebar
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                    onFolderSelect={(folderId) => {
                      setSelectedFolderId(folderId);
                      if (isMobile) setShowSidebar(false);
                    }}
                    onFolderCreate={handleFolderCreate}
                    onFolderDelete={handleFolderDelete}
                    onFolderRename={handleFolderRename}
                  />
                </div>
              )}
              
              {/* Desktop: Always show notes list */}
              {/* Mobile: Show notes list only when no note is selected or when navigating back */}
              {(!isMobile || showNotesList) && (
                <div className={`${isMobile ? 'flex-1' : 'w-64'}`}>
                  <JournalNotesList
                    notes={filteredNotes}
                    selectedNoteId={selectedNoteId}
                    onNoteSelect={handleNoteSelect}
                    onNoteCreate={handleNoteCreate}
                    onNoteDelete={handleNoteDelete}
                    onNotePin={handleNotePin}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                  />
                </div>
              )}
              
              {/* Desktop: Always show editor area */}
              {/* Mobile: Show editor only when a note is selected and notes list is hidden */}
              {(!isMobile || (selectedNoteId && !showNotesList)) && (
                <div className="flex-1">
                  {selectedNoteId ? (
                    <JournalEditor
                      title={currentTitle}
                      content={currentContent}
                      onTitleChange={setCurrentTitle}
                      onContentChange={setCurrentContent}
                      isSaving={isSaving}
                      noteId={selectedNoteId}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Select a note or create a new one
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
