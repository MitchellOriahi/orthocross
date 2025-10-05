import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StreakFlame } from "@/components/StreakFlame";
import { DailyReadingCard } from "@/components/DailyReadingCard";
import { FastingCalendar } from "@/components/FastingCalendar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Journal } from "@/components/Journal";
import { VerseOfTheDay } from "@/components/VerseOfTheDay";
import { Book, Home, BookOpen, Settings as SettingsIcon, LogOut, Scroll } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import orthodoxCrossLogo from "@/assets/orthodox-cross-logo.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [streakDays, setStreakDays] = useState(0);
  const [lastReading, setLastReading] = useState<{
    title: string;
    passage: string;
    progress: number;
    bookKey?: string;
    chapter?: number;
    totalChapters?: number;
  }>({
    title: "Gospel of John",
    passage: "John 1:1",
    progress: 0
  });

  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setStreakDays(data.current_streak);
      }
    };

    const fetchLastReading = async () => {
      if (!user) return;

      // Get the most recent completed chapter
      const { data: lastCompleted } = await supabase
        .from('completed_chapters')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastCompleted) {
        const bookKey = lastCompleted.book_key;
        const lastChapter = lastCompleted.chapter;

        // Get all completed chapters for this book
        const { data: completedChapters } = await supabase
          .from('completed_chapters')
          .select('chapter')
          .eq('user_id', user.id)
          .eq('book_key', bookKey);

        // Import book info to get total chapters and book name
        const { BIBLE_BOOKS } = await import('@/data/bibleContent');
        const bookInfo = BIBLE_BOOKS.find(b => b.title === bookKey);
        const totalChapters = bookInfo?.totalChapters || 1;
        const completedCount = completedChapters?.length || 0;
        const bookProgress = Math.round((completedCount / totalChapters) * 100);

        setLastReading({
          title: bookInfo?.bookName || bookKey,
          passage: `${bookInfo?.bookName || bookKey} ${lastChapter}`,
          progress: bookProgress,
          bookKey: bookKey,
          chapter: lastChapter + 1, // Continue from next chapter
          totalChapters: totalChapters
        });
      }
    };

    fetchStreak();
    fetchLastReading();
  }, [user]);

  // Reload data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        const fetchLastReading = async () => {
          const { data: lastCompleted } = await supabase
            .from('completed_chapters')
            .select('*')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastCompleted) {
            const bookKey = lastCompleted.book_key;
            const lastChapter = lastCompleted.chapter;

            const { data: completedChapters } = await supabase
              .from('completed_chapters')
              .select('chapter')
              .eq('user_id', user.id)
              .eq('book_key', bookKey);

            const { BIBLE_BOOKS } = await import('@/data/bibleContent');
            const bookInfo = BIBLE_BOOKS.find(b => b.title === bookKey);
            const totalChapters = bookInfo?.totalChapters || 1;
            const completedCount = completedChapters?.length || 0;
            const bookProgress = Math.round((completedCount / totalChapters) * 100);

            setLastReading({
              title: bookInfo?.bookName || bookKey,
              passage: `${bookInfo?.bookName || bookKey} ${lastChapter}`,
              progress: bookProgress,
              bookKey: bookKey,
              chapter: lastChapter + 1,
              totalChapters: totalChapters
            });
          }
        };

        fetchLastReading();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);
  
  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={orthodoxCrossLogo} alt="Orthodox Cross" className="w-10 h-10 object-contain" />
              <h1 className="text-2xl font-bold">
                Orthodox Companion
              </h1>
            </div>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
                <Home className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-5 h-5" />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="w-5 h-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Streak Section */}
        <section className="flex justify-center py-8">
          <StreakFlame days={streakDays} size="lg" />
        </section>

        {/* Continue Reading */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Continue Reading</h2>
          <DailyReadingCard
            title={lastReading.title}
            passage={lastReading.passage}
            progress={lastReading.progress}
            onStartReading={() => {
              if (lastReading.bookKey && lastReading.chapter) {
                navigate('/reading', {
                  state: {
                    book: lastReading.bookKey,
                    bookName: lastReading.title,
                    chapter: lastReading.chapter,
                    totalChapters: lastReading.totalChapters
                  }
                });
              } else {
                navigate('/index');
              }
            }}
          />
        </section>

        {/* Additional Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Verse of the Day */}
          <VerseOfTheDay />

          {/* Journal */}
          <Journal />
        </div>

        {/* Fasting Calendar */}
        <div className="max-h-[400px] overflow-auto">
          <FastingCalendar />
        </div>

        {/* Quick Actions */}
        <section className="flex flex-wrap gap-4 justify-center py-8">
          <Button variant="outline" size="lg" onClick={() => navigate('/orthodox-history')}>
            <Scroll className="w-5 h-5" />
            Orthodox History
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/index')}>
            <BookOpen className="w-5 h-5" />
            Browse Scripture
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/church-resources')}>
            <Book className="w-5 h-5" />
            Church Resources
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
