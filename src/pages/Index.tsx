import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookSelector } from "@/components/BookSelector";
import orthodoxCross from "@/assets/orthodox-cross.jpg";

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

const AVAILABLE_SCRIPTURES = [
  { title: "John", bookName: "Gospel of John", totalChapters: 21 },
  { title: "Psalms", bookName: "Psalms", totalChapters: 150 },
  { title: "Proverbs", bookName: "Proverbs", totalChapters: 31 },
  { title: "Matthew", bookName: "Gospel of Matthew", totalChapters: 28 },
  { title: "Romans", bookName: "Romans", totalChapters: 16 },
  { title: "James", bookName: "James", totalChapters: 5 },
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lastRead, setLastRead] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLastRead();
    } else {
      setLoading(false);
    }
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

  const continueReading = () => {
    if (lastRead) {
      const scripture = AVAILABLE_SCRIPTURES.find(s => s.title === lastRead.book_key);
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

  const startReading = (scripture: typeof AVAILABLE_SCRIPTURES[0], chapter: number = 1) => {
    navigate('/reading', {
      state: {
        book: scripture.title,
        bookName: scripture.bookName,
        chapter: chapter,
        totalChapters: scripture.totalChapters,
      }
    });
  };

  const getLastReadScripture = () => {
    if (!lastRead) return null;
    return AVAILABLE_SCRIPTURES.find(s => s.title === lastRead.book_key);
  };

  const lastReadScripture = getLastReadScripture();

  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-background rounded-lg p-1.5">
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
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Continue Reading</p>
                        <h3 className="text-2xl font-bold">
                          {lastReadScripture.bookName} {lastRead.current_chapter}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Last read: {new Date(lastRead.last_read_at || '').toLocaleDateString()}
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-primary" />
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
                  </CardContent>
                </Card>
              )}

              {/* Book Selector */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Scripture Library</h2>
                    <p className="text-sm text-muted-foreground">
                      Choose any book and chapter to begin reading
                    </p>
                  </div>
                  <BookSelector 
                    books={AVAILABLE_SCRIPTURES}
                    onSelectBook={startReading}
                    currentBook={lastRead?.book_key}
                  />
                </div>

                {/* Quick Access Books */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {AVAILABLE_SCRIPTURES.map((scripture) => (
                    <button
                      key={scripture.title}
                      onClick={() => startReading(scripture, 1)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        lastRead?.book_key === scripture.title
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-accent'
                      }`}
                    >
                      <div className="font-semibold text-sm mb-1">{scripture.bookName}</div>
                      <div className="text-xs text-muted-foreground">
                        {scripture.totalChapters} Ch.
                      </div>
                    </button>
                  ))}
                </div>
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
    </div>
  );
};

export default Index;
