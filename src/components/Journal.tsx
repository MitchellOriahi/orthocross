import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JournalSidebar } from "./journal/JournalSidebar";
import { JournalNotesList, type HighlightGroup } from "./journal/JournalNotesList";
import { JournalEditor } from "./journal/JournalEditor";
import { useNavigate } from "react-router-dom";
import { BIBLE_BOOKS } from "@/data/bibleContent";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Menu, Play, Pause, Volume2 } from "lucide-react";
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
  attachments?: any[];
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
  const [playingMediaId, setPlayingMediaId] = useState<string | null>(null);

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

  // Clear new note flag when user makes any meaningful edits (not just title change)
  useEffect(() => {
    if (isNewUnmodifiedNote && selectedNoteId) {
      const note = notes.find(n => n.id === selectedNoteId);
      const hasContent = currentContent && currentContent.trim() !== "";
      const hasAttachments = note?.attachments && Array.isArray(note.attachments) && (note.attachments as any[]).length > 0;
      const hasPinnedMedia = note?.pinned_media_url;
      
      // Only clear the flag if actual content/media was added
      if (hasContent || hasAttachments || hasPinnedMedia) {
        setIsNewUnmodifiedNote(false);
      }
    }
  }, [currentContent, isNewUnmodifiedNote, selectedNoteId, notes]);

  // Delete unmodified notes when closing the sheet
  useEffect(() => {
    const deleteUnmodifiedNote = async () => {
      if (!isFullScreen && isNewUnmodifiedNote && selectedNoteId) {
        // Fetch fresh note data from database to avoid stale state issues
        const { data: note } = await (supabase as any)
          .from('journal_entries')
          .select('*')
          .eq('id', selectedNoteId)
          .single();
        
        if (!note) return;
        
        // Check if note has any actual content or media (title changes don't count)
        const hasContent = note.content && note.content.trim() !== "";
        const hasAttachments = note.attachments && Array.isArray(note.attachments) && note.attachments.length > 0;
        const hasPinnedMedia = note.pinned_media_url;
        
        const isEmpty = !hasContent && !hasAttachments && !hasPinnedMedia;
        
        if (isEmpty) {
          await (supabase as any).from('journal_entries').delete().eq('id', selectedNoteId);
          setNotes(prevNotes => prevNotes.filter(n => n.id !== selectedNoteId));
          setSelectedNoteId(null);
          setIsNewUnmodifiedNote(false);
        }
      }
    };

    deleteUnmodifiedNote();
  }, [isFullScreen, isNewUnmodifiedNote, selectedNoteId]);

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

      const offlineKey = `journal_notes_${user.id}`;
      const applyNotes = (data: any[] | null) => {
        if (data) {
          setNotes(data);
          if (!selectedFolderId) {
            try { localStorage.setItem(offlineKey, JSON.stringify(data)); } catch {}
          }
        } else if (!selectedFolderId) {
          // Offline — fall back to the last synced list
          try {
            const cached = localStorage.getItem(offlineKey);
            if (cached) setNotes(JSON.parse(cached));
          } catch {}
        }
      };

      if (selectedFolderId) {
        const { data } = await query.eq('folder_id', selectedFolderId).order('updated_at', { ascending: false });
        applyNotes(data);
      } else {
        const { data } = await query.order('updated_at', { ascending: false });
        applyNotes(data);
      }
    };

    loadFolders();
    loadNotes();
  }, [user, selectedFolderId]);

  // Push any drafts that were written while offline
  useEffect(() => {
    if (!user) return;

    const syncOfflineDrafts = async () => {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key?.startsWith('journal_draft_')) continue;
        try {
          const draft = JSON.parse(localStorage.getItem(key)!);
          const noteId = key.slice('journal_draft_'.length);
          const { error } = await (supabase as any)
            .from('journal_entries')
            .update({
              title: draft.title || null,
              content: draft.content || null,
              updated_at: draft.updatedAt,
            })
            .eq('id', noteId)
            .eq('user_id', user.id);
          if (!error) localStorage.removeItem(key);
        } catch {}
      }
    };

    syncOfflineDrafts();
    window.addEventListener('online', syncOfflineDrafts);
    return () => window.removeEventListener('online', syncOfflineDrafts);
  }, [user]);

  // Load selected note
  useEffect(() => {
    if (!selectedNoteId) return;
    
    const note = notes.find(n => n.id === selectedNoteId);
    if (note) {
      // An unsynced offline draft newer than the server copy wins
      let draft: { title: string; content: string; updatedAt: string } | null = null;
      try {
        const raw = localStorage.getItem(`journal_draft_${selectedNoteId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (new Date(parsed.updatedAt) > new Date(note.updated_at)) draft = parsed;
        }
      } catch {}

      setCurrentTitle(draft ? draft.title : (note.title || ""));
      setCurrentContent(draft ? draft.content : (note.content || ""));
      
      // If note already has content or media, clear the new/unmodified flag
      const hasContent = note.content && note.content.trim() !== "";
      const hasAttachments = note.attachments && Array.isArray(note.attachments) && (note.attachments as any[]).length > 0;
      const hasPinnedMedia = note.pinned_media_url;
      
      if (hasContent || hasAttachments || hasPinnedMedia) {
        setIsNewUnmodifiedNote(false);
      }
    }
  }, [selectedNoteId, notes]);

  // Auto-save with debounce
  useEffect(() => {
    if (!user || !selectedNoteId) return;

    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      const updatedAt = new Date().toISOString();
      const draftKey = `journal_draft_${selectedNoteId}`;
      // Draft goes to local storage first, so writing offline never loses work
      try {
        localStorage.setItem(draftKey, JSON.stringify({ title: currentTitle, content: currentContent, updatedAt }));
      } catch {}
      try {
        const { error } = await (supabase as any)
          .from('journal_entries')
          .update({
            title: currentTitle || null,
            content: currentContent || null,
            updated_at: updatedAt
          })
          .eq('id', selectedNoteId);

        if (!error) {
          try { localStorage.removeItem(draftKey); } catch {}
        }

        // Update only the current note in the list instead of refreshing everything
        setNotes(prevNotes =>
          prevNotes.map(note =>
            note.id === selectedNoteId
              ? { ...note, title: currentTitle, content: currentContent, updated_at: updatedAt }
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

  const todayEntryTitle = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  const [dailyVerse, setDailyVerse] = useState<{ reference: string; verse_text: string } | null>(null);
  useEffect(() => {
    (supabase.rpc as any)("get_verse_of_the_day").then(
      ({ data }: { data: { reference: string; verse_text: string }[] | null }) => {
        if (data && data.length > 0) setDailyVerse(data[0]);
      }
    );
  }, []);

  const navigate = useNavigate();
  const [highlightGroups, setHighlightGroups] = useState<HighlightGroup[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase
      .from('verse_highlights')
      .select('scripture_title, chapter, highlight_color')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return;
        const byBook = new Map<string, { count: number; firstChapter: number; colors: Set<string> }>();
        for (const h of data) {
          const g = byBook.get(h.scripture_title) ?? { count: 0, firstChapter: h.chapter, colors: new Set<string>() };
          g.count++;
          g.firstChapter = Math.min(g.firstChapter, h.chapter);
          if (h.highlight_color) g.colors.add(h.highlight_color);
          byBook.set(h.scripture_title, g);
        }
        setHighlightGroups(
          [...byBook.entries()].map(([book, g]) => ({
            book, count: g.count, firstChapter: g.firstChapter, colors: [...g.colors],
          }))
        );
      });
  }, [user, isFullScreen]);

  const handleOpenHighlights = (book: string) => {
    const info = BIBLE_BOOKS.find(b => b.title === book);
    const group = highlightGroups.find(g => g.book === book);
    navigate('/reading', {
      state: {
        book,
        bookName: info?.bookName ?? book,
        chapter: group?.firstChapter ?? 1,
        totalChapters: info?.totalChapters ?? 1,
      },
    });
  };

  const handleOpenToday = async () => {
    const verse = dailyVerse;
    if (!user) return;

    const existing = notes.find(n => n.title === todayEntryTitle);
    if (existing) {
      setSelectedNoteId(existing.id);
      setIsFullScreen(true);
      if (isMobile) setShowNotesList(false);
      return;
    }

    const initialContent = verse
      ? `<p><em>“${verse.verse_text}” — ${verse.reference}</em></p><p><br></p>`
      : "";
    const { data, error } = await (supabase as any)
      .from('journal_entries')
      .insert({
        user_id: user.id,
        folder_id: null,
        title: todayEntryTitle,
        content: initialContent,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating today's entry", variant: "destructive" });
      return;
    }
    if (data) {
      setNotes([data, ...notes]);
      setSelectedNoteId(data.id);
      setIsFullScreen(true);
      if (isMobile) setShowNotesList(false);
    }
  };

  const handleNoteCreate = async () => {
    if (!user) return;
    
    const { data, error } = await (supabase as any)
      .from('journal_entries')
      .insert({
        user_id: user.id,
        folder_id: selectedFolderId,
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
      
      // Check if note has any actual content or media (title changes don't count)
      const hasContent = note?.content && note.content.trim() !== "";
      const hasAttachments = note?.attachments && Array.isArray(note.attachments) && (note.attachments as any[]).length > 0;
      const hasPinnedMedia = note?.pinned_media_url;
      const isEmpty = !hasContent && !hasAttachments && !hasPinnedMedia;
      
      if (note && isEmpty) {
        await (supabase as any).from('journal_entries').delete().eq('id', selectedNoteId);
        setNotes(notes.filter(n => n.id !== selectedNoteId));
      }
    }
    
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

  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  const [renameState, setRenameState] = useState<{ folderId: string; name: string } | null>(null);

  const handleFolderDelete = (folderId: string) => {
    setConfirmState({
      title: "Delete this folder?",
      description: "The folder and all notes inside it will be permanently deleted.",
      onConfirm: async () => {
        await (supabase as any).from('journal_folders').delete().eq('id', folderId);
        setFolders(folders.filter(f => f.id !== folderId));
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
        }
      },
    });
  };

  const handleFolderRename = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    setRenameState({ folderId, name: folder.name });
  };

  const submitFolderRename = async () => {
    if (!renameState || !renameState.name.trim()) return;
    const { folderId, name } = renameState;
    setRenameState(null);

    await (supabase as any)
      .from('journal_folders')
      .update({ name })
      .eq('id', folderId);

    setFolders(folders.map(f => f.id === folderId ? { ...f, name } : f));
  };

  const handleNoteDelete = (noteId: string) => {
    setConfirmState({
      title: "Delete this note?",
      description: "This note will be permanently deleted.",
      onConfirm: async () => {
        await (supabase as any).from('journal_entries').delete().eq('id', noteId);
        setNotes(notes.filter(n => n.id !== noteId));
        if (selectedNoteId === noteId) {
          setSelectedNoteId(null);
        }
      },
    });
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
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : pinnedMediaType === 'video' ? (
                    <>
                      <video 
                        src={pinnedMediaUrl} 
                        className="max-w-full max-h-full object-contain"
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
        <SheetContent side="bottom" className="inset-0 h-[100dvh] w-screen p-0 max-w-none" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetTitle className="sr-only">Journal Editor</SheetTitle>
          <div className="h-full flex flex-col">
            <div className="border-b border-border p-2 flex items-center bg-card safe-top">
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
                    <div className="p-2 border-b border-border flex items-center safe-top">
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
                <div className={`${isMobile ? 'flex-1' : 'w-72'} flex flex-col bg-card/30`}>
                  <JournalNotesList
                    todayEntry={notes.find(n => n.title === todayEntryTitle) ?? null}
                    onOpenToday={handleOpenToday}
                    userId={user?.id}
                    highlightGroups={highlightGroups}
                    onOpenHighlights={handleOpenHighlights}
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

      <AlertDialog open={!!confirmState} onOpenChange={(open) => !open && setConfirmState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmState?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmState?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                confirmState?.onConfirm();
                setConfirmState(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!renameState} onOpenChange={(open) => !open && setRenameState(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitFolderRename();
            }}
          >
            <Input
              value={renameState?.name ?? ''}
              onChange={(e) => setRenameState(s => s ? { ...s, name: e.target.value } : s)}
              autoComplete="off"
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setRenameState(null)}>Cancel</Button>
              <Button type="submit" disabled={!renameState?.name.trim()}>Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
