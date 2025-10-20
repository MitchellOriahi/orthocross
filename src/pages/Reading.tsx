import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings as SettingsIcon, Scroll, Type, ChevronLeft, ChevronRight, BookMarked, Highlighter, BookOpen, Bookmark, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChapterSelector } from "@/components/ChapterSelector";
import { bibleContent, BIBLE_BOOKS } from "@/data/bibleContent";
import { useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import orthodoxCrossLight from "@/assets/orthodox-cross-light.png";

interface VerseHighlight {
  id: string;
  verse_number: number;
  highlight_color: string;
}

interface VerseBookmark {
  id: string;
  verse_number: number;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-200/30 dark:bg-yellow-400/20' },
  { name: 'Green', value: 'green', bg: 'bg-green-200/30 dark:bg-green-400/20' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-200/30 dark:bg-blue-400/20' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-200/30 dark:bg-pink-400/20' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-200/30 dark:bg-purple-400/20' },
];

const Reading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const state = location.state || {};
  const book = state.book || "John";
  const bookName = state.bookName || "Gospel of John";
  const initialChapter = state.chapter || 1;
  const totalChapters = state.totalChapters || 21;

  const [fontSize, setFontSize] = useState([18]);
  const [chapter, setChapter] = useState(initialChapter);
  const [readingMode, setReadingMode] = useState<"scroll" | "page">(() => {
    const saved = localStorage.getItem('readingMode');
    return (saved === 'scroll' || saved === 'page') ? saved : 'scroll';
  });
  const [highlights, setHighlights] = useState<VerseHighlight[]>([]);
  const [bookmarks, setBookmarks] = useState<VerseBookmark[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [verses, setVerses] = useState<Array<{number: number; text: string}>>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);

  // Load verses from database first, then API, then fallback to hardcoded content
  useEffect(() => {
    const loadVerses = async () => {
      setLoadingVerses(true);
      
      try {
        // First, try to load from database
        const { data: dbVerses, error: dbError } = await supabase
          .from('bible_verses')
          .select('verse_number, verse_text')
          .eq('book', book)
          .eq('chapter', chapter)
          .order('verse_number');

        if (!dbError && dbVerses && dbVerses.length > 0) {
          const formattedVerses = dbVerses.map(v => ({
            number: v.verse_number,
            text: v.verse_text
          }));
          setVerses(formattedVerses);
          setLoadingVerses(false);
          return;
        }

        // If not in database, check hardcoded content
        const hardcodedVerses = bibleContent[book]?.[chapter];
        if (hardcodedVerses && hardcodedVerses.length > 0) {
          setVerses(hardcodedVerses);
          
          // Save hardcoded verses to database for future use
          const versesToInsert = hardcodedVerses.map(v => ({
            book,
            chapter,
            verse_number: v.number,
            verse_text: v.text
          }));
          
          await supabase
            .from('bible_verses')
            .upsert(versesToInsert, {
              onConflict: 'book,chapter,verse_number'
            });
          
          setLoadingVerses(false);
          return;
        }

        // Finally, try fetching from Bible API
        const { data, error } = await supabase.functions.invoke('fetch-bible-chapter', {
          body: { book, chapter }
        });

        if (error) throw error;
        
        if (data?.verses && data.verses.length > 0) {
          setVerses(data.verses);
          
          // Save API verses to database for future use
          const versesToInsert = data.verses.map((v: {number: number, text: string}) => ({
            book,
            chapter,
            verse_number: v.number,
            verse_text: v.text
          }));
          
          await supabase
            .from('bible_verses')
            .upsert(versesToInsert, {
              onConflict: 'book,chapter,verse_number'
            });
        } else {
          setVerses([]);
        }
      } catch (error) {
        console.error('Error loading verses:', error);
        setVerses([]);
      } finally {
        setLoadingVerses(false);
      }
    };

    loadVerses();
  }, [book, chapter]);

  useEffect(() => {
    if (user) {
      loadHighlights();
      loadBookmarks();
      loadProgress();
    }
  }, [user, book, chapter]);

  // Persist reading mode preference
  useEffect(() => {
    localStorage.setItem('readingMode', readingMode);
  }, [readingMode]);

  const loadHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('verse_highlights')
        .select('*')
        .eq('user_id', user?.id)
        .eq('scripture_title', book)
        .eq('chapter', chapter);

      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  };

  const loadBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from('verse_bookmarks')
        .select('*')
        .eq('user_id', user?.id)
        .eq('scripture_title', book)
        .eq('chapter', chapter);

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('progress')
        .eq('user_id', user?.id)
        .eq('scripture_title', book)
        .eq('scripture_passage', `${book} ${chapter}`)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async (newProgress: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reading_progress')
        .upsert({
          user_id: user.id,
          scripture_title: bookName,
          scripture_passage: `${bookName} ${chapter}`,
          progress: newProgress,
          completed: newProgress === 100,
          current_chapter: chapter,
          current_verse: 1,
          book_key: book,
          last_read_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,scripture_title,scripture_passage'
        });

      if (error) throw error;
      setProgress(newProgress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Auto-save reading position when chapter changes
  useEffect(() => {
    if (user && verses.length > 0) {
      const timer = setTimeout(() => {
        saveProgress(progress);
      }, 2000); // Save 2 seconds after chapter loads
      
      return () => clearTimeout(timer);
    }
  }, [chapter, user]);

  const toggleHighlight = async (verseNumber: number, color: string) => {
    if (!user) return;

    const existingHighlight = highlights.find(h => h.verse_number === verseNumber);

    try {
      if (existingHighlight) {
        // Update the color if it's different, otherwise remove
        if (existingHighlight.highlight_color !== color) {
          const { error } = await supabase
            .from('verse_highlights')
            .update({ highlight_color: color })
            .eq('id', existingHighlight.id);

          if (error) throw error;
          setHighlights(highlights.map(h => 
            h.verse_number === verseNumber ? { ...h, highlight_color: color } : h
          ));
          toast({ description: "Highlight color updated" });
        } else {
          const { error } = await supabase
            .from('verse_highlights')
            .delete()
            .eq('id', existingHighlight.id);

          if (error) throw error;
          setHighlights(highlights.filter(h => h.verse_number !== verseNumber));
          toast({ description: "Highlight removed" });
        }
      } else {
        const { data, error } = await supabase
          .from('verse_highlights')
          .insert({
            user_id: user.id,
            scripture_title: book,
            chapter: chapter,
            verse_number: verseNumber,
            highlight_color: color,
          })
          .select()
          .single();

        if (error) throw error;
        setHighlights([...highlights, data]);
        toast({ description: "Verse highlighted" });
      }
    } catch (error) {
      console.error('Error toggling highlight:', error);
      toast({ 
        description: "Failed to update highlight", 
        variant: "destructive" 
      });
    }
  };

  const handleVerseClick = (verseNumber: number) => {
    setSelectedVerse(verseNumber === selectedVerse ? null : verseNumber);
  };

  const handleChapterChange = async (newChapter: number) => {
    setChapter(newChapter);
    setSelectedVerse(null);
    setCurrentVerseIndex(0);
    setProgress(0);
    
    // Save progress when changing chapters
    if (user) {
      await saveProgress(0);
    }
  };

  const handleNextVerse = () => {
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
      setSelectedVerse(null);
    } else if (chapter < totalChapters) {
      handleNextChapter();
    }
  };

  const handlePrevVerse = () => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(currentVerseIndex - 1);
      setSelectedVerse(null);
    } else if (chapter > 1) {
      handlePrevChapter();
    }
  };

  const handleNextChapter = () => {
    if (chapter < totalChapters) {
      handleChapterChange(chapter + 1);
    }
  };

  const handlePrevChapter = () => {
    if (chapter > 1) {
      handleChapterChange(chapter - 1);
    }
  };

  const markChapterComplete = async () => {
    if (!user) return;
    
    await saveProgress(100);
    
    // Save to completed_chapters table
    try {
      await supabase
        .from('completed_chapters')
        .upsert({
          user_id: user.id,
          book_key: book,
          chapter: chapter,
        }, {
          onConflict: 'user_id,book_key,chapter'
        });
      
      // Update streak immediately after completing activity
      const { updateUserStreak } = await import('@/utils/streakManager');
      await updateUserStreak(user.id);

      // Create friend activity for chapter completion
      await supabase
        .from('friend_activities')
        .insert({
          user_id: user.id,
          activity_type: 'chapter_completed',
          activity_data: {
            book_key: book,
            chapter: chapter
          }
        });

      // Add point to monthly leaderboard for chapter completion
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: leaderboard } = await supabase
        .from('monthly_leaderboard')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_date', currentMonth)
        .maybeSingle();

      if (leaderboard) {
        await supabase
          .from('monthly_leaderboard')
          .update({
            chapters_completed: (leaderboard.chapters_completed || 0) + 1,
            total_points: (leaderboard.total_points || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', leaderboard.id);
      } else {
        await supabase
          .from('monthly_leaderboard')
          .insert({
            user_id: user.id,
            month_date: currentMonth,
            history_islands_completed: 0,
            chapters_completed: 1,
            saints_read_count: 0,
            total_points: 1
          });
      }
      
      toast({
        description: "Chapter completed! 🎉",
        duration: 3000,
      });

      // Check if book is now complete
      const { data: completedInBook } = await supabase
        .from('completed_chapters')
        .select('chapter')
        .eq('user_id', user.id)
        .eq('book_key', book);

      const bookInfo = BIBLE_BOOKS.find((b) => b.title === book);
      if (bookInfo && completedInBook && completedInBook.length === bookInfo.totalChapters) {
        // Book just completed! Create friend activity
        await supabase
          .from('friend_activities')
          .insert({
            user_id: user.id,
            activity_type: 'book_completed',
            activity_data: {
              book_key: book,
              book_name: bookInfo.bookName
            }
          });

        // Check if entire Bible is completed
        const { data: allCompleted } = await supabase
          .from('completed_chapters')
          .select('book_key, chapter')
          .eq('user_id', user.id);

        if (allCompleted) {
          const booksCompleted = new Map();
          allCompleted.forEach(c => {
            if (!booksCompleted.has(c.book_key)) {
              booksCompleted.set(c.book_key, new Set());
            }
            booksCompleted.get(c.book_key).add(c.chapter);
          });

          const allBooksComplete = BIBLE_BOOKS.every((book) => {
            const completedChaptersInBook = booksCompleted.get(book.title);
            return completedChaptersInBook && completedChaptersInBook.size === book.totalChapters;
          });

          if (allBooksComplete) {
            await supabase
              .from('friend_activities')
              .insert({
                user_id: user.id,
                activity_type: 'bible_completed',
                activity_data: {
                  total_chapters: BIBLE_BOOKS.reduce((sum: number, book: any) => sum + book.totalChapters, 0)
                }
              });
          }
        }
      }
      
      // Navigate to next chapter if available
      if (chapter < totalChapters) {
        setTimeout(() => {
          handleChapterChange(chapter + 1);
        }, 500);
      }
    } catch (error) {
      console.error('Error saving completed chapter:', error);
    }
  };

  const toggleBookmark = async (verseNumber: number) => {
    if (!user) return;

    const existingBookmark = bookmarks.find(b => b.verse_number === verseNumber);

    try {
      if (existingBookmark) {
        const { error } = await supabase
          .from('verse_bookmarks')
          .delete()
          .eq('id', existingBookmark.id);

        if (error) throw error;
        setBookmarks(bookmarks.filter(b => b.verse_number !== verseNumber));
        toast({ description: "Bookmark removed" });
      } else {
        const { data, error } = await supabase
          .from('verse_bookmarks')
          .insert({
            user_id: user.id,
            scripture_title: book,
            chapter: chapter,
            verse_number: verseNumber,
          })
          .select()
          .single();

        if (error) throw error;
        setBookmarks([...bookmarks, data]);
        toast({ description: "Verse bookmarked" });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({ 
        description: "Failed to update bookmark", 
        variant: "destructive" 
      });
    }
  };

  const getHighlightColor = (verseNumber: number) => {
    const highlight = highlights.find(h => h.verse_number === verseNumber);
    return highlight ? HIGHLIGHT_COLORS.find(c => c.value === highlight.highlight_color) : null;
  };

  const isBookmarked = (verseNumber: number) => {
    return bookmarks.some(b => b.verse_number === verseNumber);
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (readingMode === "page") {
      // In page mode, navigate verses
      if (clickX < halfWidth) {
        handlePrevVerse();
      } else {
        handleNextVerse();
      }
    } else {
      // In scroll mode, navigate chapters
      if (clickX < halfWidth) {
        if (chapter > 1) {
          handlePrevChapter();
        }
      } else {
        if (chapter < totalChapters) {
          handleNextChapter();
        }
      }
    }
  };

  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
            </div>
            <nav className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </nav>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4">

          <ChapterSelector
            book={bookName}
            totalChapters={totalChapters}
            currentChapter={chapter}
            onChapterChange={handleChapterChange}
          />

          {/* Controls */}
          <div className="flex items-center justify-between mt-4 gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 flex-shrink-0" />
              <Slider
                value={fontSize}
                onValueChange={setFontSize}
                min={14}
                max={24}
                step={2}
                className="w-24 sm:w-32"
              />
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant={readingMode === "scroll" ? "default" : "outline"}
                size="sm"
                onClick={() => setReadingMode("scroll")}
                className="text-xs sm:text-sm"
              >
                <Scroll className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Scroll</span>
              </Button>
              <Button
                variant={readingMode === "page" ? "default" : "outline"}
                size="sm"
                onClick={() => setReadingMode("page")}
                className="text-xs sm:text-sm"
              >
                <BookOpen className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Page</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Reading Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 shadow-sacred">
            <div className="space-y-6" ref={contentRef}>
              <div className="text-center border-b pb-4">
                <h1 className="text-3xl font-bold">{bookName}</h1>
                <p className="text-muted-foreground mt-2">Chapter {chapter}</p>
              </div>

              {/* Verses */}
              {readingMode === "scroll" ? (
                <div 
                  className="space-y-4" 
                  style={{ fontSize: `${fontSize[0]}px`, lineHeight: '1.8' }}
                  onClick={handleContentClick}
                >
                  {loadingVerses ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading verses...</p>
                      </div>
                    </div>
                  ) : verses.length > 0 ? (
                    verses.map((verse) => {
                      const highlightColor = getHighlightColor(verse.number);
                      const bookmarked = isBookmarked(verse.number);
                      return (
                        <div
                          key={verse.number}
                          className={`
                            group relative p-3 rounded-lg transition-all cursor-pointer
                            ${highlightColor ? highlightColor.bg : 'hover:bg-muted/50'}
                            ${selectedVerse === verse.number ? 'ring-2 ring-primary' : ''}
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerseClick(verse.number);
                          }}
                        >
                          <span className="font-bold text-primary mr-2">{verse.number}</span>
                          {bookmarked && <Bookmark className="w-3 h-3 inline-block mr-1 fill-primary text-primary" />}
                          <span>{verse.text}</span>
                          
                          {selectedVerse === verse.number && (
                            <div className="absolute right-2 top-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(verse.number);
                                }}
                              >
                                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                              </Button>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Highlighter className="w-4 h-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2" onClick={(e) => e.stopPropagation()}>
                                  <div className="space-y-2">
                                    {HIGHLIGHT_COLORS.map((color) => (
                                      <Button
                                        key={color.value}
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleHighlight(verse.number, color.value);
                                        }}
                                      >
                                        <div className={`w-4 h-4 rounded mr-2 ${color.bg}`}></div>
                                        {color.name}
                                      </Button>
                                    ))}
                                    {highlightColor && (
                                      <>
                                        <div className="border-t my-2"></div>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleHighlight(verse.number, highlightColor.value);
                                          }}
                                        >
                                          Remove Highlight
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Chapter content not yet available</p>
                      <p className="text-sm mt-2">This chapter will be added soon</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[400px] flex flex-col justify-between">
                  {loadingVerses ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading verses...</p>
                      </div>
                    </div>
                  ) : verses.length > 0 ? (
                    <>
                      <div
                        className={`
                          flex-1 p-6 rounded-lg transition-all cursor-pointer
                          ${getHighlightColor(verses[currentVerseIndex].number) ? getHighlightColor(verses[currentVerseIndex].number)!.bg : 'hover:bg-muted/30'}
                          ${selectedVerse === verses[currentVerseIndex].number ? 'ring-2 ring-primary' : ''}
                        `}
                        style={{ fontSize: `${fontSize[0]}px`, lineHeight: '1.8' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerseClick(verses[currentVerseIndex].number);
                        }}
                      >
                        <div className="text-center space-y-4">
                          <div>
                            <sup className="font-bold text-primary text-xl mr-2">{verses[currentVerseIndex].number}</sup>
                            {isBookmarked(verses[currentVerseIndex].number) && (
                              <Bookmark className="w-4 h-4 inline-block mr-2 fill-primary text-primary" />
                            )}
                          </div>
                          <p className="leading-relaxed">{verses[currentVerseIndex].text}</p>
                          
                          {selectedVerse === verses[currentVerseIndex].number && (
                            <div className="flex justify-center gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(verses[currentVerseIndex].number);
                                }}
                              >
                                <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked(verses[currentVerseIndex].number) ? 'fill-current' : ''}`} />
                                {isBookmarked(verses[currentVerseIndex].number) ? 'Remove Bookmark' : 'Bookmark'}
                              </Button>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Highlighter className="w-4 h-4 mr-2" />
                                    Highlight
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2" onClick={(e) => e.stopPropagation()}>
                                  <div className="space-y-2">
                                    {HIGHLIGHT_COLORS.map((color) => (
                                      <Button
                                        key={color.value}
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleHighlight(verses[currentVerseIndex].number, color.value);
                                        }}
                                      >
                                        <div className={`w-4 h-4 rounded mr-2 ${color.bg}`}></div>
                                        {color.name}
                                      </Button>
                                    ))}
                                    {getHighlightColor(verses[currentVerseIndex].number) && (
                                      <>
                                        <div className="border-t my-2"></div>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleHighlight(verses[currentVerseIndex].number, getHighlightColor(verses[currentVerseIndex].number)!.value);
                                          }}
                                        >
                                          Remove Highlight
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Chapter content not yet available</p>
                      <p className="text-sm mt-2">This chapter will be added soon</p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t gap-2 flex-wrap sm:flex-nowrap">
                {readingMode === "page" ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handlePrevVerse}
                      disabled={currentVerseIndex === 0 && chapter === 1}
                      className="flex-shrink-0"
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>

                    {verses.length > 0 && currentVerseIndex === verses.length - 1 && (
                      <Button variant="sacred" onClick={markChapterComplete} size="sm" className="text-xs sm:text-sm">
                        <BookMarked className="w-4 h-4 sm:mr-2" />
                        <span className="hidden xs:inline">Mark </span>Complete
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={handleNextVerse}
                      disabled={currentVerseIndex === verses.length - 1 && chapter === totalChapters}
                      className="flex-shrink-0"
                      size="sm"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4 sm:ml-2" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handlePrevChapter}
                      disabled={chapter === 1}
                      className="flex-shrink-0"
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>

                    {verses.length > 0 && (
                      <Button variant="sacred" onClick={markChapterComplete} size="sm" className="text-xs sm:text-sm">
                        <BookMarked className="w-4 h-4 sm:mr-2" />
                        <span className="hidden xs:inline">Mark </span>Complete
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={handleNextChapter}
                      disabled={chapter === totalChapters}
                      className="flex-shrink-0"
                      size="sm"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4 sm:ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Reading;
