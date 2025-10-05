import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, BookOpen, Type, ChevronLeft, ChevronRight, BookMarked, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChapterSelector } from "@/components/ChapterSelector";
import { bibleContent } from "@/data/bibleContent";

interface VerseHighlight {
  id: string;
  verse_number: number;
  highlight_color: string;
}

const Reading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const state = location.state || {};
  const book = state.book || "John";
  const bookName = state.bookName || "Gospel of John";
  const initialChapter = state.chapter || 1;
  const totalChapters = state.totalChapters || 21;

  const [fontSize, setFontSize] = useState([18]);
  const [chapter, setChapter] = useState(initialChapter);
  const [readingMode, setReadingMode] = useState<"scroll" | "page">("scroll");
  const [highlights, setHighlights] = useState<VerseHighlight[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [verses, setVerses] = useState<Array<{number: number; text: string}>>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);

  // Load verses from API or fallback to hardcoded content
  useEffect(() => {
    const loadVerses = async () => {
      setLoadingVerses(true);
      
      // Check if we have hardcoded content for Orthodox books
      const hardcodedVerses = bibleContent[book]?.[chapter];
      if (hardcodedVerses && hardcodedVerses.length > 0) {
        setVerses(hardcodedVerses);
        setLoadingVerses(false);
        return;
      }

      // Otherwise fetch from Bible API
      try {
        const { data, error } = await supabase.functions.invoke('fetch-bible-chapter', {
          body: { book, chapter }
        });

        if (error) throw error;
        
        if (data?.verses && data.verses.length > 0) {
          setVerses(data.verses);
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
      loadProgress();
    }
  }, [user, book, chapter]);

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

  const toggleHighlight = async (verseNumber: number) => {
    if (!user) return;

    const existingHighlight = highlights.find(h => h.verse_number === verseNumber);

    try {
      if (existingHighlight) {
        const { error } = await supabase
          .from('verse_highlights')
          .delete()
          .eq('id', existingHighlight.id);

        if (error) throw error;
        setHighlights(highlights.filter(h => h.verse_number !== verseNumber));
        toast({ description: "Highlight removed" });
      } else {
        const { data, error } = await supabase
          .from('verse_highlights')
          .insert({
            user_id: user.id,
            scripture_title: book,
            chapter: chapter,
            verse_number: verseNumber,
            highlight_color: 'yellow',
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
    setProgress(0);
    
    // Save progress when changing chapters
    if (user) {
      await saveProgress(0);
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
      
      toast({
        description: "Chapter completed! 🎉",
      });
      
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

  const isHighlighted = (verseNumber: number) => {
    return highlights.some(h => h.verse_number === verseNumber);
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (clickX < halfWidth) {
      // Clicked on left side - go to previous chapter
      if (chapter > 1) {
        handlePrevChapter();
      }
    } else {
      // Clicked on right side - go to next chapter
      if (chapter < totalChapters) {
        handleNextChapter();
      }
    }
  };

  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate('/index')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>

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
                <BookOpen className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Scroll</span>
              </Button>
              <Button
                variant={readingMode === "page" ? "default" : "outline"}
                size="sm"
                onClick={() => setReadingMode("page")}
                className="text-xs sm:text-sm"
              >
                <BookMarked className="w-4 h-4 sm:mr-2" />
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
                    verses.map((verse) => (
                      <div
                        key={verse.number}
                        className={`
                          group relative p-3 rounded-lg transition-all cursor-pointer
                          ${isHighlighted(verse.number) ? 'bg-yellow-200/30 dark:bg-yellow-400/20' : 'hover:bg-muted/50'}
                          ${selectedVerse === verse.number ? 'ring-2 ring-primary' : ''}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerseClick(verse.number);
                        }}
                      >
                        <span className="font-bold text-primary mr-2">{verse.number}</span>
                        <span>{verse.text}</span>
                        
                        {selectedVerse === verse.number && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute right-2 top-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleHighlight(verse.number);
                            }}
                          >
                            <Highlighter className="w-4 h-4 mr-2" />
                            {isHighlighted(verse.number) ? 'Remove' : 'Highlight'}
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Chapter content not yet available</p>
                      <p className="text-sm mt-2">This chapter will be added soon</p>
                    </div>
                  )}
                </div>
              ) : (
                <div 
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
                    <div className="prose prose-lg max-w-none">
                      <p className="leading-relaxed">
                        {verses.map((verse, idx) => (
                          <span key={verse.number}>
                            <sup className="font-bold text-primary">{verse.number}</sup>
                            {verse.text}
                            {idx < verses.length - 1 && ' '}
                          </span>
                        ))}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Chapter content not yet available</p>
                      <p className="text-sm mt-2">This chapter will be added soon</p>
                    </div>
                  )}
                </div>
              )}

              {/* Chapter Navigation */}
              <div className="flex items-center justify-between pt-6 border-t gap-2 flex-wrap sm:flex-nowrap">
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
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Reading;
