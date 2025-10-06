import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BIBLE_BOOKS, getCategorizedBooks, BookInfo } from "@/data/bibleContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ChapterMarkingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChaptersUpdated: () => void;
}

export function ChapterMarkingDialog({ open, onOpenChange, onChaptersUpdated }: ChapterMarkingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(null);
  const [completedChapters, setCompletedChapters] = useState<Record<string, Set<number>>>({});
  const [loading, setLoading] = useState(false);

  const { oldTestament, newTestament, additional } = getCategorizedBooks();

  useEffect(() => {
    if (open && user) {
      loadCompletedChapters();
    }
  }, [open, user]);

  const loadCompletedChapters = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('completed_chapters')
        .select('book_key, chapter')
        .eq('user_id', user.id);

      if (error) throw error;

      const chapters: Record<string, Set<number>> = {};
      data?.forEach((item) => {
        if (!chapters[item.book_key]) {
          chapters[item.book_key] = new Set();
        }
        chapters[item.book_key].add(item.chapter);
      });

      setCompletedChapters(chapters);
    } catch (error) {
      console.error('Error loading completed chapters:', error);
    }
  };

  const toggleChapter = async (bookKey: string, chapter: number) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const isCompleted = completedChapters[bookKey]?.has(chapter);

      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('completed_chapters')
          .delete()
          .eq('user_id', user.id)
          .eq('book_key', bookKey)
          .eq('chapter', chapter);

        if (error) throw error;

        setCompletedChapters(prev => {
          const newState = { ...prev };
          if (newState[bookKey]) {
            newState[bookKey] = new Set(newState[bookKey]);
            newState[bookKey].delete(chapter);
          }
          return newState;
        });
      } else {
        // Add completion
        const { error } = await supabase
          .from('completed_chapters')
          .insert({
            user_id: user.id,
            book_key: bookKey,
            chapter: chapter,
            completed_at: new Date().toISOString(),
          });

        if (error) throw error;

        // Update streak immediately after completing activity
        const { updateUserStreak } = await import('@/utils/streakManager');
        await updateUserStreak(user.id);

        setCompletedChapters(prev => {
          const newState = { ...prev };
          if (!newState[bookKey]) {
            newState[bookKey] = new Set();
          } else {
            newState[bookKey] = new Set(newState[bookKey]);
          }
          newState[bookKey].add(chapter);
          return newState;
        });
      }

      onChaptersUpdated();
    } catch (error) {
      console.error('Error toggling chapter:', error);
      toast({
        title: "Error",
        description: "Failed to update chapter status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBooksList = () => {
    const sections = [
      { name: "Old Testament", data: oldTestament, color: "orange" },
      { name: "New Testament", data: newTestament, color: "blue" },
      { name: "Additional Readings", data: { "Additional Readings": additional }, color: "purple" },
    ];

    return (
      <div className="space-y-6 max-h-[60vh] overflow-y-auto">
        {sections.map((section) => (
          <div key={section.name}>
            <h3 className="text-lg font-semibold mb-3 text-${section.color}-700 dark:text-${section.color}-400">
              {section.name}
            </h3>
            <div className="space-y-4">
              {Object.entries(section.data).map(([category, books]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {books.map((book) => {
                      const completed = completedChapters[book.title]?.size || 0;
                      const progress = (completed / book.totalChapters) * 100;
                      
                      return (
                        <button
                          key={book.title}
                          onClick={() => setSelectedBook(book)}
                          className="p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-left"
                        >
                          <div className="font-medium text-sm">{book.bookName}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {completed}/{book.totalChapters} chapters
                          </div>
                          {progress > 0 && (
                            <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                              <div
                                className="bg-primary rounded-full h-1.5 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderChapterGrid = () => {
    if (!selectedBook) return null;

    const chapters = Array.from({ length: selectedBook.totalChapters }, (_, i) => i + 1);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedBook(null)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h3 className="text-lg font-semibold">{selectedBook.bookName}</h3>
        </div>
        
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[50vh] overflow-y-auto p-2">
          {chapters.map((chapter) => {
            const isCompleted = completedChapters[selectedBook.title]?.has(chapter);
            
            return (
              <button
                key={chapter}
                onClick={() => toggleChapter(selectedBook.title, chapter)}
                disabled={loading}
                className={`
                  aspect-square rounded-lg border-2 font-medium text-sm
                  transition-all hover:scale-105 disabled:opacity-50
                  ${isCompleted 
                    ? 'bg-green-500 border-green-600 text-white hover:bg-green-600' 
                    : 'bg-background border-border hover:border-primary hover:bg-accent'
                  }
                `}
              >
                {chapter}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Mark Chapters as Read</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {selectedBook ? renderChapterGrid() : renderBooksList()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
