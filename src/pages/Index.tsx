import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Play, Download, AlertCircle, Info, Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookSelector } from "@/components/BookSelector";
import { BottomNavigation } from "@/components/BottomNavigation";
import { BIBLE_BOOKS, getCategorizedBooks, BookInfo } from "@/data/bibleContent";
import orthodoxCrossDark from "@/assets/orthodox-cross.jpg";
import orthodoxCrossLight from "@/assets/orthodox-cross-light.png";
import { useTheme } from "next-themes";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ChapterMarkingDialog } from "@/components/ChapterMarkingDialog";
import { BibleProgressTutorial } from "@/components/BibleProgressTutorial";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ReadingProgress {
  id: string;
  scripture_title: string;
  scripture_passage: string;
  progress: number;
  completed: boolean;
  current_chapter: number;
  current_verse: number;
  book_key: string;
  last_read_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const orthodoxCross = theme === 'light' ? orthodoxCrossLight : orthodoxCrossDark;
  const [lastRead, setLastRead] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [bibleCompletion, setBibleCompletion] = useState(0);
  const [bookProgress, setBookProgress] = useState<Record<string, number>>({});
  const [hasScriptureData, setHasScriptureData] = useState(true);
  const [importing, setImporting] = useState(false);
  const [showChapterMarking, setShowChapterMarking] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  const { oldTestament, newTestament, additional } = getCategorizedBooks();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      loadLastRead();
      loadBibleCompletion();
      loadBookProgress();
      checkScriptureData();
      
      // Check if user has seen the tutorial
      const hasSeenTutorial = localStorage.getItem("hasSeenBibleProgressTutorial");
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleTutorialComplete = () => {
    localStorage.setItem("hasSeenBibleProgressTutorial", "true");
    setShowTutorial(false);
  };

  const checkScriptureData = async () => {
    try {
      const { count } = await supabase
        .from('bible_verses')
        .select('*', { count: 'exact', head: true });
      
      setHasScriptureData((count ?? 0) > 100);
    } catch (error) {
      console.error('Error checking scripture data:', error);
    }
  };

  const handleImportScripture = async () => {
    setImporting(true);
    try {
      const response = await fetch('/orthodox_books_bundle.zip');
      const blob = await response.blob();
      const file = new File([blob], 'orthodox_books_bundle.zip', { type: 'application/zip' });

      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const importResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-zip-upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!importResponse.ok) {
        throw new Error(`Import failed: ${importResponse.statusText}`);
      }

      const result = await importResponse.json();

      if (result.errors && result.errors.length > 0) {
        console.error('Import errors:', result.errors);
      }

      toast({
        title: "Import Successful",
        description: `Imported ${result.totalVerses} verses from ${result.processedBooks.length} books.`,
      });

      setHasScriptureData(true);
      await checkScriptureData();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import scripture data.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  // Reload Bible completion when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadBibleCompletion();
        loadLastRead();
        loadBookProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const loadLastRead = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user?.id)
        .order('last_read_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setLastRead(data);
    } catch (error) {
      console.error('Error loading last read:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBibleCompletion = async () => {
    try {
      const { data, error } = await supabase
        .from('completed_chapters')
        .select('book_key, chapter')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Calculate progress for each book and overall completion simultaneously
      // This ensures perfect synchronization between individual book progress and overall completion
      const progressByBook: Record<string, number> = {};
      let totalCompletedChapters = 0;
      const totalBibleChapters = BIBLE_BOOKS.reduce((sum, book) => sum + book.totalChapters, 0);
      
      BIBLE_BOOKS.forEach((book) => {
        const completedChapters = data?.filter(c => c.book_key === book.title).length || 0;
        totalCompletedChapters += completedChapters;
        
        if (completedChapters > 0) {
          const percentage = Math.round((completedChapters / book.totalChapters) * 100);
          progressByBook[book.title] = percentage;
        }
      });

      // Overall Bible completion = (total completed chapters / total Bible chapters)
      // This directly corresponds to the sum of all individual book progress
      // Show one decimal place to make progress more visible
      const completion = Math.round((totalCompletedChapters / totalBibleChapters) * 1000) / 10;
      
      setBookProgress(progressByBook);
      setBibleCompletion(completion);
    } catch (error) {
      console.error('Error loading Bible completion:', error);
    }
  };

  // Use the same function for book progress to keep them in sync
  const loadBookProgress = loadBibleCompletion;

  const continueReading = () => {
    if (lastRead) {
      const scripture = BIBLE_BOOKS.find(s => s.title === lastRead.book_key);
      if (scripture) {
        navigate('/reading', {
          state: {
            book: scripture.title,
            bookName: scripture.bookName,
            chapter: lastRead.current_chapter || 1,
            totalChapters: scripture.totalChapters,
          }
        });
      }
    }
  };

  const startReading = async (scripture: BookInfo, chapter?: number) => {
    // If no chapter specified, find the last read chapter for this book
    if (!chapter && user) {
      try {
        const { data, error } = await supabase
          .from('completed_chapters')
          .select('chapter')
          .eq('user_id', user.id)
          .eq('book_key', scripture.title)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          // Start from the next chapter after the last completed one
          chapter = Math.min(data.chapter + 1, scripture.totalChapters);
        }
      } catch (error) {
        console.error('Error fetching last read chapter:', error);
      }
    }

    navigate('/reading', {
      state: {
        book: scripture.title,
        bookName: scripture.bookName,
        chapter: chapter || 1,
        totalChapters: scripture.totalChapters,
      }
    });
  };

  const getLastReadScripture = () => {
    if (!lastRead) return null;
    return BIBLE_BOOKS.find(s => s.title === lastRead.book_key);
  };

  const lastReadScripture = getLastReadScripture();

  // Calculate section completion percentage
  const calculateSectionProgress = (books: BookInfo[]) => {
    const totalChapters = books.reduce((sum, book) => sum + book.totalChapters, 0);
    const completedChapters = books.reduce((sum, book) => {
      const completed = Object.entries(bookProgress)
        .filter(([key]) => key === book.title)
        .reduce((acc, [_, progress]) => acc + (book.totalChapters * progress / 100), 0);
      return sum + completed;
    }, 0);
    return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  };

  return (
    <div className="min-h-screen gradient-peaceful pb-20">

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center p-1.5 ${theme === 'light' ? 'bg-black' : 'bg-white'}`}>
                <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold">Scripture</h1>
          </div>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <SettingsIcon className="w-5 h-5" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Scripture Library */}
              <div className="space-y-6">
                {!hasScriptureData && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Scripture Data Not Loaded</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-3 mt-2">
                        <p>To read all books, chapters, and verses, import the complete scripture library.</p>
                        <Button 
                          onClick={handleImportScripture}
                          disabled={importing}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {importing ? "Importing..." : "Import Scripture Library"}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Scripture Library</h2>
                  </div>
                  <BookSelector 
                    books={BIBLE_BOOKS}
                    onSelectBook={startReading}
                    currentBook={lastRead?.book_key}
                  />
                </div>

                {/* Bible Completion Progress */}
                {user && (
                  <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold">Overall Bible Completion</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{bibleCompletion.toFixed(1)}%</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setShowChapterMarking(true)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div
                            className="bg-primary rounded-full h-3 transition-all duration-500"
                            style={{ width: `${bibleCompletion}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <ChapterMarkingDialog
                  open={showChapterMarking}
                  onOpenChange={setShowChapterMarking}
                  onChaptersUpdated={() => {
                    loadBibleCompletion();
                    loadBookProgress();
                  }}
                />

                {showTutorial && <BibleProgressTutorial onComplete={handleTutorialComplete} />}

                {/* OLD TESTAMENT */}
                <Card className="border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold mb-4 text-orange-700 dark:text-orange-400">Old Testament</h3>
                    <Accordion type="multiple" className="space-y-2">
                      {Object.entries(oldTestament).map(([category, books]) => {
                        const sectionProgress = calculateSectionProgress(books);
                        return (
                          <AccordionItem key={category} value={category} className="border rounded-lg bg-background/50">
                            <AccordionTrigger className="px-4 hover:no-underline group">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="font-semibold text-lg">{category}</div>
                                  <div className="text-xs text-muted-foreground">({books.length} books)</div>
                                </div>
                                <div className="group-data-[state=open]:hidden">
                                  <Progress value={sectionProgress} className="h-1.5" />
                                </div>
                              </div>
                            </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                              {books.map((book) => (
                                <button
                                  key={book.title}
                                  onClick={() => startReading(book)}
                                  className={`p-3 rounded-lg border transition-all text-left hover:border-primary hover:bg-accent ${
                                    lastRead?.book_key === book.title
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border'
                                  }`}
                                >
                                  <div className="font-medium text-sm">{book.bookName}</div>
                                  <div className="text-xs text-muted-foreground">{book.totalChapters} Ch.</div>
                                  {bookProgress[book.title] > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <Progress value={bookProgress[book.title]} className="h-1.5" />
                                      <div className="text-xs text-muted-foreground text-right">
                                        {bookProgress[book.title]}%
                                      </div>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </CardContent>
                </Card>

                {/* NEW TESTAMENT */}
                <Card className="border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-400">New Testament</h3>
                    <Accordion type="multiple" className="space-y-2">
                      {Object.entries(newTestament).map(([category, books]) => {
                        const sectionProgress = calculateSectionProgress(books);
                        return (
                          <AccordionItem key={category} value={category} className="border rounded-lg bg-background/50">
                            <AccordionTrigger className="px-4 hover:no-underline group">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="font-semibold text-lg">{category}</div>
                                  <div className="text-xs text-muted-foreground">({books.length} books)</div>
                                </div>
                                <div className="group-data-[state=open]:hidden">
                                  <Progress value={sectionProgress} className="h-1.5" />
                                </div>
                              </div>
                            </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                              {books.map((book) => (
                                <button
                                  key={book.title}
                                  onClick={() => startReading(book)}
                                  className={`p-3 rounded-lg border transition-all text-left hover:border-primary hover:bg-accent ${
                                    lastRead?.book_key === book.title
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border'
                                  }`}
                                >
                                  <div className="font-medium text-sm">{book.bookName}</div>
                                  <div className="text-xs text-muted-foreground">{book.totalChapters} Ch.</div>
                                  {bookProgress[book.title] > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <Progress value={bookProgress[book.title]} className="h-1.5" />
                                      <div className="text-xs text-muted-foreground text-right">
                                        {bookProgress[book.title]}%
                                      </div>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </CardContent>
                </Card>

                {/* ADDITIONAL READINGS */}
                <Card className="border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-400">Orthodox Additional Readings</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {additional.map((book) => (
                        <button
                          key={book.title}
                          onClick={() => startReading(book)}
                          className={`p-3 rounded-lg border transition-all text-left hover:border-primary hover:bg-accent ${
                            lastRead?.book_key === book.title
                              ? 'border-primary bg-primary/5'
                              : 'border-border'
                          }`}
                        >
                          <div className="font-medium text-sm">{book.bookName}</div>
                          <div className="text-xs text-muted-foreground">{book.totalChapters} Ch.</div>
                          {bookProgress[book.title] > 0 && (
                            <div className="mt-2 space-y-1">
                              <Progress value={bookProgress[book.title]} className="h-1.5" />
                              <div className="text-xs text-muted-foreground text-right">
                                {bookProgress[book.title]}%
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 OrthoCross App. Building faith through daily practice.</p>
        </div>
      </footer>

      <BottomNavigation />
    </div>
  );
};

export default Index;
