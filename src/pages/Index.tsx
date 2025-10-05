import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookSelector } from "@/components/BookSelector";
import { BottomNavigation } from "@/components/BottomNavigation";
import { BIBLE_BOOKS, getCategorizedBooks, BookInfo } from "@/data/bibleContent";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

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
  const [lastRead, setLastRead] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [bibleCompletion, setBibleCompletion] = useState(0);
  const [bookProgress, setBookProgress] = useState<Record<string, number>>({});
  
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
    } else {
      setLoading(false);
    }
  }, [user]);

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

  return (
    <div className="min-h-screen gradient-peaceful pb-20">

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-foreground dark:bg-background rounded-lg flex items-center justify-center p-1.5">
              <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-bold">Available Scriptures</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
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
              {/* Continue Reading Card - YouVersion Style */}
              {lastRead && lastReadScripture && (
                <Card className="border-2 border-primary/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Continue Reading</p>
                          <h3 className="text-2xl font-bold">
                            {lastReadScripture.bookName}
                          </h3>
                          <p className="text-lg text-muted-foreground mt-1">
                            Chapter {lastRead.current_chapter} of {lastReadScripture.totalChapters}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Last read: {new Date(lastRead.last_read_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      
                      {/* Book Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Book Progress</span>
                          <span className="font-medium">
                            {Math.round((lastRead.current_chapter / lastReadScripture.totalChapters) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{
                              width: `${(lastRead.current_chapter / lastReadScripture.totalChapters) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={continueReading}
                        className="w-full gap-2"
                        size="lg"
                        variant="sacred"
                      >
                        <Play className="w-4 h-4" />
                        Continue Reading
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Scripture Library */}
              <div className="space-y-6">
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
                          <span className="font-bold text-primary">{bibleCompletion.toFixed(1)}%</span>
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

                {/* OLD TESTAMENT */}
                <Card className="border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold mb-4 text-orange-700 dark:text-orange-400">Old Testament</h3>
                    <Accordion type="multiple" className="space-y-2">
                      {Object.entries(oldTestament).map(([category, books]) => (
                        <AccordionItem key={category} value={category} className="border rounded-lg bg-background/50">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-lg">{category}</div>
                              <div className="text-xs text-muted-foreground">({books.length} books)</div>
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
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>

                {/* NEW TESTAMENT */}
                <Card className="border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-400">New Testament</h3>
                    <Accordion type="multiple" className="space-y-2">
                      {Object.entries(newTestament).map(([category, books]) => (
                        <AccordionItem key={category} value={category} className="border rounded-lg bg-background/50">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-lg">{category}</div>
                              <div className="text-xs text-muted-foreground">({books.length} books)</div>
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
                      ))}
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
