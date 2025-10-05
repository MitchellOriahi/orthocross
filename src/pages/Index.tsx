import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import orthodoxCross from "@/assets/orthodox-cross.jpg";

interface ReadingProgress {
  id: string;
  scripture_title: string;
  scripture_passage: string;
  progress: number;
  completed: boolean;
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
  const [progressData, setProgressData] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user]);

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setProgressData(data || []);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScriptureProgress = (title: string) => {
    return progressData.find(p => p.scripture_title === title);
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Choose Your Scripture Reading</h2>
            <p className="text-muted-foreground">
              Select a scripture to begin or continue your reading journey.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {AVAILABLE_SCRIPTURES.map((scripture) => {
                return (
                  <Card key={scripture.title} className="hover:shadow-sacred transition-smooth">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{scripture.bookName}</CardTitle>
                          <CardDescription>{scripture.totalChapters} Chapters</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => startReading(scripture, 1)}
                        className="w-full"
                        variant="sacred"
                      >
                        Start Reading
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
