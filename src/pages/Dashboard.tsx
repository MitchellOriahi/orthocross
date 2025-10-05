import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StreakFlame } from "@/components/StreakFlame";
import { DailyReadingCard } from "@/components/DailyReadingCard";
import { FastingCalendar } from "@/components/FastingCalendar";
import { FastingCalendarView } from "@/components/FastingCalendarView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Journal } from "@/components/Journal";
import { VerseOfTheDay } from "@/components/VerseOfTheDay";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Home, Settings as SettingsIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import orthodoxCross from "@/assets/orthodox-cross.jpg";

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
        const nextChapter = lastChapter + 1;

        // Import book info to get total chapters and book name
        const { BIBLE_BOOKS } = await import('@/data/bibleContent');
        const bookInfo = BIBLE_BOOKS.find(b => b.title === bookKey);
        const totalChapters = bookInfo?.totalChapters || 1;
        const bookName = bookInfo?.bookName || bookKey;

        // Get progress for the next chapter (current reading position)
        const { data: chapterProgress } = await supabase
          .from('reading_progress')
          .select('progress')
          .eq('user_id', user.id)
          .eq('book_key', bookKey)
          .eq('current_chapter', nextChapter)
          .maybeSingle();

        const currentProgress = chapterProgress?.progress || 0;

        setLastReading({
          title: bookName,
          passage: `${bookName} ${nextChapter}`,
          progress: currentProgress,
          bookKey: bookKey,
          chapter: nextChapter,
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
            const nextChapter = lastChapter + 1;

            const { BIBLE_BOOKS } = await import('@/data/bibleContent');
            const bookInfo = BIBLE_BOOKS.find(b => b.title === bookKey);
            const totalChapters = bookInfo?.totalChapters || 1;
            const bookName = bookInfo?.bookName || bookKey;

            const { data: chapterProgress } = await supabase
              .from('reading_progress')
              .select('progress')
              .eq('user_id', user.id)
              .eq('book_key', bookKey)
              .eq('current_chapter', nextChapter)
              .maybeSingle();

            const currentProgress = chapterProgress?.progress || 0;

            setLastReading({
              title: bookName,
              passage: `${bookName} ${nextChapter}`,
              progress: currentProgress,
              bookKey: bookKey,
              chapter: nextChapter,
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
    <div className="min-h-screen gradient-peaceful pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center p-1.5">
                <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
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
        <FastingCalendar />
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Dashboard;
