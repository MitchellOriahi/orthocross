import { useState, useEffect, useRef } from "react";
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
import { ChevronLeft, Play, Pause, Volume2, X, FolderPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { hasNoteAdditions, shouldDiscardDraft } from "./journal/emptyNote";
import { ALL_NOTES, DEFAULT_NOTES_FOLDER_NAME, isDefaultNotesFolder, needsDefaultNotesFolder, notesInFolder, newNoteFolder, selectionAfterExit } from './journal/folderScope';
import { isJournalViewMode, journalViewKey, resolveJournalView } from './journal/viewPreference';
import { shouldSwipeBack } from './journal/swipeBack';
import { TreeFolder, folderSiblings, reorderedSiblings } from './journal/folderTree';

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
  attachments?: any[];
}

interface JournalFolder extends TreeFolder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_default?: boolean | null;
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
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingFolders, setEditingFolders] = useState(false);
  const [reorderingFolders, setReorderingFolders] = useState(false);
  const [showNotesList, setShowNotesList] = useState(true);
  
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentContent, setCurrentContent] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  const viewRevisionRef = useRef(0);
  const viewSaveRef = useRef<Promise<unknown>>(Promise.resolve());
  const draftRef = useRef<{ id: string; userId: string; modified: boolean } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [playingMediaId, setPlayingMediaId] = useState<string | null>(null);

  // Load view preference
  useEffect(() => {
    if (!user) return;
    let active = true;
    const revision = viewRevisionRef.current;
    let cached: string | null = null;
    try { cached = localStorage.getItem(journalViewKey(user.id)); } catch { /* Storage may be unavailable. */ }
    setViewMode(isJournalViewMode(cached) ? cached : 'list');

    const loadViewPreference = async () => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('journal_view_mode')
        .eq('id', user.id)
        .single();
      
      if (!active) return;
      setViewMode(current => resolveJournalView(data?.journal_view_mode, cached, current, revision !== viewRevisionRef.current));
    };

    loadViewPreference();
    return () => { active = false; };
  }, [user?.id]);

  const discardUntouchedDraft = () => {
    const draft = draftRef.current;
    const note = notes.find(n => n.id === draft?.id);
    if (!draft || !shouldDiscardDraft(true, draft.modified, {
      ...note, title: currentTitle, content: currentContent,
    })) return;

    draftRef.current = null;
    setNotes(prev => prev.filter(n => n.id !== draft.id));
    if (selectedNoteId === draft.id) setSelectedNoteId(null);
    void (supabase as any).from('journal_entries').delete()
      .eq('id', draft.id).eq('user_id', draft.userId)
      .then(({ error }: { error: unknown }) => {
        if (error) {
          if (note) setNotes(prev => prev.some(n => n.id === note.id) ? prev : [note, ...prev]);
          toast({ title: "Could not remove empty note", variant: "destructive" });
        }
      });
  };

  // A route change also leaves the editor; only this session's untouched draft is eligible.
  useEffect(() => () => {
    const draft = draftRef.current;
    if (draft && !draft.modified) {
      draftRef.current = null;
      void (supabase as any).from('journal_entries').delete()
        .eq('id', draft.id).eq('user_id', draft.userId);
    }
  }, []);

  const handleTitleChange = (value: string) => {
    if (draftRef.current && hasNoteAdditions({ title: value })) draftRef.current.modified = true;
    setCurrentTitle(value);
  };

  const handleContentChange = (value: string) => {
    if (draftRef.current && hasNoteAdditions({ content: value })) draftRef.current.modified = true;
    setCurrentContent(value);
  };

  // Load folders and notes
  useEffect(() => {
    if (!user) return;

    const loadFolders = async () => {
      const { data } = await (supabase as any)
        .from('journal_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order').order('name');
      if (!data) return;

      // Every account gets one default "Notes" folder, shown under All Notes.
      if (needsDefaultNotesFolder(data)) {
        const { data: created } = await (supabase as any)
          .from('journal_folders')
          .insert({ user_id: user.id, name: DEFAULT_NOTES_FOLDER_NAME, parent_id: null, sort_order: -1, is_default: true })
          .select()
          .single();
        setFolders(created ? [created, ...data] : data);
        return;
      }
      setFolders(data);
    };

    const loadNotes = async () => {
      const query = (supabase as any)
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id);
      
      const { data } = await query.order('updated_at', { ascending: false });
      if (data) setNotes(data);
    };

    loadFolders();
    loadNotes();
  }, [user]);

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
    if (!user || !selectedNoteId || draftRef.current?.modified === false) return;

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

  const saveCurrentNote = async () => {
    if (!user || !selectedNoteId || draftRef.current?.modified === false) return true;
    const updated = { title: currentTitle || null, content: currentContent || null, updated_at: new Date().toISOString() };
    const { error } = await (supabase as any).from('journal_entries').update(updated)
      .eq('id', selectedNoteId).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error saving note', variant: 'destructive' });
      return false;
    }
    setNotes(prev => prev.map(note => note.id === selectedNoteId ? { ...note, ...updated } : note));
    return true;
  };

  const handleFolderSelect = async (folderId: string | null) => {
    if (!await saveCurrentNote()) return;
    discardUntouchedDraft();
    setSelectedNoteId(null);
    setSelectedFolderId(folderId);
    setSearchQuery('');
    setShowNotesList(true);
    setShowSidebar(false);
    setIsNoteExpanded(false);
  };

  const clearExitedSelection = (destination: 'notes' | 'folders' | 'home') => {
    const selection = selectionAfterExit(destination, selectedFolderId);
    setSelectedNoteId(selection.noteId);
    setSelectedFolderId(selection.folderId);
  };

  const handleBackToFolders = async () => {
    if (!await saveCurrentNote()) return;
    discardUntouchedDraft();
    clearExitedSelection('folders');
    setSearchQuery('');
    setIsNoteExpanded(false);
    setShowNotesList(true);
    setShowSidebar(true);
  };

  // Rightward swipe goes back one level, exiting Journal from its folder browser.
  const getSwipeBack = (): (() => void) | null => {
    if (!isMobile) return null;
    if (selectedNoteId && !showNotesList) {
      return () => { void (async () => { if (await saveCurrentNote()) { discardUntouchedDraft(); clearExitedSelection('notes'); setShowNotesList(true); } })(); };
    }
    if (showSidebar) return () => { void handleClose(); };
    return () => { void handleBackToFolders(); };
  };

  const handleNoteMove = async (noteId: string, folderId: string | null) => {
    if (!user || (noteId === selectedNoteId && !await saveCurrentNote())) return;
    const { error } = await (supabase as any).from('journal_entries').update({ folder_id: folderId })
      .eq('id', noteId).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error moving note', variant: 'destructive' });
      return;
    }
    setNotes(prev => prev.map(note => note.id === noteId ? { ...note, folder_id: folderId } : note));
    const folderName = folderId ? folders.find(folder => folder.id === folderId)?.name : null;
    toast({ title: 'Note moved', description: folderName ?? 'All Notes' });
  };

  const handleNoteCreate = async () => {
    if (!user) return;
    if (!await saveCurrentNote()) return;
    discardUntouchedDraft();
    
    const { data, error } = await (supabase as any)
      .from('journal_entries')
      .insert({
        user_id: user.id,
        folder_id: newNoteFolder(selectedFolderId),
        title: "",
        content: ""
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: "Error creating note", variant: "destructive" });
      return;
    }
    
    if (data) {
      setNotes(prev => [data, ...prev]);
      setCurrentTitle("");
      setCurrentContent("");
      draftRef.current = { id: data.id, userId: user.id, modified: false };
      setSelectedNoteId(data.id);
      setIsFullScreen(true);

      if (isMobile) {
        setShowNotesList(false);
      }
    }
  };

  const handleNoteSelect = async (noteId: string) => {
    if (selectedNoteId !== noteId && !await saveCurrentNote()) return;
    if (selectedNoteId !== noteId) discardUntouchedDraft();

    // Synchronously prime the editor with the selected note's content so it
    // renders correctly on the first click (the editor only syncs innerHTML
    // when noteId changes, so content must be ready by then).
    const target = notes.find(n => n.id === noteId);
    if (target) {
      setCurrentTitle(target.title || "");
      setCurrentContent(target.content || "");
    } else {
      // Fallback: fetch fresh from DB
      const { data } = await (supabase as any)
        .from('journal_entries')
        .select('*')
        .eq('id', noteId)
        .single();
      if (data) {
        setCurrentTitle(data.title || "");
        setCurrentContent(data.content || "");
        setNotes((prev) => prev.some(n => n.id === data.id) ? prev : [data, ...prev]);
      }
    }

    setSelectedNoteId(noteId);
    setIsFullScreen(true);

    if (isMobile) {
      setShowNotesList(false);
    }
  };

  const handleFolderCreate = async (parentId: string | null = null) => {
    if (!user) return;
    
    const folderName = prompt("Enter folder name:");
    if (!folderName?.trim()) return;
    
    const { data, error } = await (supabase as any)
      .from('journal_folders')
      .insert({
        user_id: user.id,
        name: folderName.trim(),
        parent_id: parentId,
        sort_order: Math.max(-1, ...folderSiblings(folders, parentId).map(f => f.sort_order)) + 1
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: "Error creating folder", variant: "destructive" });
      return;
    }
    
    if (data) {
      setFolders(prev => [...prev, data]);
    }
  };

  const handleFolderDelete = async (folderId: string) => {
    const target = folders.find(folder => folder.id === folderId);
    if (!user || isDefaultNotesFolder(target ?? {})) return;
    if (!confirm("Delete this folder? Its notes will be moved to All Notes.")) return;
    if (!await saveCurrentNote()) return;
    const { error: moveError } = await (supabase as any).from('journal_entries')
      .update({ folder_id: null }).eq('folder_id', folderId).eq('user_id', user.id);
    if (moveError) {
      toast({ title: 'Error moving note', variant: 'destructive' });
      return;
    }
    setNotes(prev => prev.map(note => note.folder_id === folderId ? { ...note, folder_id: null } : note));
    const { error } = await (supabase as any).from('journal_folders').delete().eq('id', folderId).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error deleting folder', variant: 'destructive' });
      return;
    }
    const deleted = folders.find(f => f.id === folderId);
    setFolders(prev => prev.filter(f => f.id !== folderId).map(f => f.parent_id === folderId ? { ...f, parent_id: deleted?.parent_id ?? null } : f));
    if (selectedFolderId === folderId) {
      await handleFolderSelect(null);
    }
  };

  const handleFolderRename = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const newName = prompt("Enter new folder name:", folder.name);
    if (!newName?.trim()) return;
    
    const { error } = await (supabase as any)
      .from('journal_folders')
      .update({ name: newName.trim() })
      .eq('id', folderId);
    if (error) {
      toast({ title: 'Error renaming folder', variant: 'destructive' });
      return;
    }
    
    setFolders(folders.map(f => f.id === folderId ? { ...f, name: newName.trim() } : f));
  };

  const handleFolderReorder = async (folderId: string, direction: -1 | 1) => {
    if (!user || reorderingFolders) return;
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    const ordered = reorderedSiblings(folders, folderId, direction);
    setReorderingFolders(true);
    try {
      const { error } = await supabase.rpc('reorder_journal_folders', { p_parent_id: folder.parent_id, p_ids: ordered.map(f => f.id) });
      if (error) {
        toast({ title: 'Could not save folder order', variant: 'destructive' });
        const { data } = await supabase.from('journal_folders').select('*').eq('user_id', user.id);
        if (data) setFolders(data);
        return;
      }
      setFolders(previous => previous.map(f => ordered.find(updated => updated.id === f.id) ?? f));
    } finally { setReorderingFolders(false); }
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

  // Pinning a drawing or media item also makes its note the dashboard cover.
  const handleMediaPinChange = async (noteId: string, mediaUrl: string | null, mediaType: string | null) => {
    if (mediaUrl) {
      const others = notes.filter(n => n.pinned && n.id !== noteId);
      for (const other of others) {
        await (supabase as any).from('journal_entries').update({ pinned: false }).eq('id', other.id);
      }
      await (supabase as any).from('journal_entries').update({ pinned: true }).eq('id', noteId);
    }
    setNotes(prev => prev.map(n => {
      if (n.id === noteId) {
        return { ...n, pinned_media_url: mediaUrl, pinned_media_type: mediaType, pinned: mediaUrl ? true : n.pinned };
      }
      return mediaUrl ? { ...n, pinned: false } : n;
    }));
  };

  const handleViewModeChange = async (newMode: 'list' | 'gallery') => {
    viewRevisionRef.current += 1;
    setViewMode(newMode);
    if (!user) return;
    try { localStorage.setItem(journalViewKey(user.id), newMode); } catch { /* Keep the in-memory preference. */ }
    const userId = user.id;
    viewSaveRef.current = viewSaveRef.current.catch(() => undefined).then(async () => {
      const { error } = await (supabase as any).from('profiles')
        .update({ journal_view_mode: newMode }).eq('id', userId);
      if (error) toast({ title: 'Could not save note view', variant: 'destructive' });
    });
    await viewSaveRef.current;
  };

  const filteredNotes = notesInFolder(notes, selectedFolderId).filter(note => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      (note.title?.toLowerCase().includes(searchLower)) ||
      (note.content?.toLowerCase().includes(searchLower))
    );
  });

  const handleClose = async () => {
    if (!await saveCurrentNote()) return;
    discardUntouchedDraft();
    clearExitedSelection('home');
    setSearchQuery('');
    setIsFullScreen(false);
    setIsNoteExpanded(false);
    setShowSidebar(true);
    setShowNotesList(true);
    setEditingFolders(false);
  };

  const pinnedNote = notes.find(n => n.pinned);
  const displayNote = pinnedNote;
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
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow mt-10"
        onClick={() => !isFullScreen && setIsFullScreen(true)}
      >
        <div className={pinnedMediaUrl && pinnedMediaType ? "h-[300px] overflow-hidden" : "h-[200px] overflow-hidden"}>
          {hasContent ? (
            <>
              {/* Show pinned media if available, taking full height */}
              {pinnedMediaUrl && pinnedMediaType ? (
                <div className="h-full w-full overflow-hidden bg-muted flex items-center justify-center relative group">
                  {pinnedMediaType === 'image' || pinnedMediaType === 'drawing' ? (
                    <img 
                      src={pinnedMediaUrl} 
                      alt="Pinned media" 
                      className="w-full h-full object-contain"
                    />
                  ) : pinnedMediaType === 'video' ? (
                    <>
                      <video 
                        src={pinnedMediaUrl} 
                        className="w-full h-full object-contain"
                        muted
                        onPlay={() => setPlayingMediaId(displayNote.id)}
                        onPause={() => setPlayingMediaId(null)}
                        onEnded={() => setPlayingMediaId(null)}
                        id="journal-video"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const mediaElement = document.getElementById('journal-video') as HTMLVideoElement;
                            if (mediaElement) {
                              if (mediaElement.paused) {
                                mediaElement.play().catch(err => console.error('Video play failed:', err));
                              } else {
                                mediaElement.pause();
                              }
                            }
                          }}
                          className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
                        >
                          {playingMediaId === displayNote.id ? (
                            <Pause className="h-8 w-8 text-primary" />
                          ) : (
                            <Play className="h-8 w-8 text-primary ml-1" />
                          )}
                        </button>
                      </div>
                    </>
                  ) : pinnedMediaType === 'audio' ? (
                    <>
                      <div className="flex items-center justify-center w-full h-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                      </div>
                      <audio 
                        src={pinnedMediaUrl} 
                        className="hidden"
                        onPlay={() => setPlayingMediaId(displayNote.id)}
                        onPause={() => setPlayingMediaId(null)}
                        onEnded={() => setPlayingMediaId(null)}
                        id="journal-audio"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const mediaElement = document.getElementById('journal-audio') as HTMLAudioElement;
                            if (mediaElement) {
                              if (mediaElement.paused) {
                                mediaElement.play().catch(err => console.error('Audio play failed:', err));
                              } else {
                                mediaElement.pause();
                              }
                            }
                          }}
                          className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
                        >
                          {playingMediaId === displayNote.id ? (
                            <Pause className="h-8 w-8 text-primary" />
                          ) : (
                            <Play className="h-8 w-8 text-primary ml-1" />
                          )}
                        </button>
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
                      className="w-full h-full object-contain bg-muted"
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

      <Sheet open={isFullScreen} onOpenChange={(open) => open ? setIsFullScreen(true) : handleClose()}>
        <SheetContent side="bottom" className="inset-0 h-[100dvh] w-full p-0 max-w-none [&>button.absolute]:hidden">
          <SheetTitle className="sr-only">Journal Editor</SheetTitle>
          <div className="h-full flex flex-col">
            <div className="border-b border-border pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 px-2 min-h-16 flex items-center bg-card">
              {!isMobile && isNoteExpanded && (
                <Button
                  variant="ghost"
                  onClick={() => setIsNoteExpanded(false)}
                  aria-label="Back to Journal"
                  title="Back to Journal"
                  className="mr-1 shrink-0 gap-1"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="text-sm">Back</span>
                </Button>
              )}
              {isMobile && selectedNoteId && !showNotesList && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => { if (!await saveCurrentNote()) return; discardUntouchedDraft(); clearExitedSelection('notes'); setShowNotesList(true); }}
                  className="mr-2"
                  aria-label="Back to notes"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              {!isMobile && !showSidebar && selectedFolderId && !isNoteExpanded && (
                <Button variant="ghost" size="icon" onClick={handleBackToFolders} aria-label="Back to folders" title="Back to folders" className="mr-2 shrink-0">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              {isMobile && !showSidebar && showNotesList && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToFolders}
                    className="mr-2"
                    aria-label="Back to folders"
                    title="Back to folders"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
              )}
              <h3 className={`flex-1 min-w-0 truncate font-semibold${showSidebar ? ' text-2xl ps-3' : ''}`} translate={selectedFolderId && selectedFolderId !== ALL_NOTES ? 'no' : undefined}>
                {showSidebar ? 'Folders' : selectedFolderId === ALL_NOTES ? 'All Notes' : folders.find(folder => folder.id === selectedFolderId)?.name ?? 'Notes'}
              </h3>
              {showSidebar && <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" className="h-11 min-w-[4.5rem] px-4 text-base font-medium rounded-xl border border-border/60 bg-muted/70 hover:bg-muted" onClick={() => setEditingFolders(value => !value)}>{editingFolders ? 'Done' : 'Edit'}</Button>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-border/60 bg-muted/70 hover:bg-muted" onClick={() => handleFolderCreate()} aria-label="New folder" title="New folder"><FolderPlus className="h-5 w-5" /></Button>
              </div>}
              {showSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  aria-label="Close"
                  className="h-11 w-11 shrink-0 ms-2 rounded-xl border border-border/60 bg-muted/70 hover:bg-muted"
                >
                  <X className="h-6 w-6" />
                </Button>
              )}
            </div>

            <div
              className="flex-1 min-h-0 min-w-0 flex overflow-hidden"
              onTouchStart={(e) => {
                const t = e.touches[0];
                touchStartRef.current = { x: t.clientX, y: t.clientY };
              }}
              onTouchEnd={(e) => {
                const start = touchStartRef.current;
                touchStartRef.current = null;
                if (!start) return;
                const t = e.changedTouches[0];
                if (shouldSwipeBack(start, { x: t.clientX, y: t.clientY })) {
                  getSwipeBack()?.();
                }
              }}
            >
              {showSidebar && (
                <div className="flex-1 min-w-0 flex flex-col">
                  <JournalSidebar
                    folders={folders.map(folder => ({ ...folder, noteCount: notesInFolder(notes, folder.id).length }))}
                    totalNoteCount={notesInFolder(notes, ALL_NOTES).length}
                    selectedFolderId={selectedFolderId}
                    onFolderSelect={handleFolderSelect}
                    onFolderCreate={handleFolderCreate}
                    onFolderDelete={handleFolderDelete}
                    onFolderRename={handleFolderRename}
                    editing={editingFolders}
                    reordering={reorderingFolders}
                    onFolderReorder={handleFolderReorder}
                  />
                </div>
              )}
              
              {/* Desktop: Always show notes list */}
              {/* Mobile: Show notes list only when no note is selected or when navigating back */}
              {!showSidebar && (!isMobile || showNotesList) && (
                <div className={`${isMobile ? 'flex-1 min-w-0' : 'w-64 shrink-0 min-w-0'} ${!isMobile && isNoteExpanded ? 'hidden' : ''}`}>
                  <JournalNotesList
                    key={selectedFolderId ?? 'general'}
                    folders={folders}
                    onNoteMove={handleNoteMove}
                    isFolderView={selectedFolderId !== null && selectedFolderId !== ALL_NOTES}
                    notes={filteredNotes}
                    selectedNoteId={selectedNoteId}
                    onNoteSelect={handleNoteSelect}
                    onNoteExpand={isMobile ? undefined : async (noteId) => {
                      await handleNoteSelect(noteId);
                      setIsNoteExpanded(true);
                    }}
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
              {!showSidebar && (!isMobile || (selectedNoteId && !showNotesList)) && (
                <div className="flex-1 min-w-0">
                  {selectedNoteId ? (
                    <JournalEditor
                      title={currentTitle}
                      content={currentContent}
                      onTitleChange={handleTitleChange}
                      onContentChange={handleContentChange}
                      isSaving={isSaving}
                      noteId={selectedNoteId}
                      onMediaPinChange={handleMediaPinChange}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
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
