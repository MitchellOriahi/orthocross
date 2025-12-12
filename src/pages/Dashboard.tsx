import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StreakFlame } from "@/components/StreakFlame";
import { DailyReadingCard } from "@/components/DailyReadingCard";
import { FastingCalendar } from "@/components/FastingCalendar";
import { FastingCalendarView } from "@/components/FastingCalendarView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DonateButton } from "@/components/DonateButton";
import { DonationPromptDialog } from "@/components/DonationPromptDialog";
import { Journal } from "@/components/Journal";
import { VerseOfTheDay } from "@/components/VerseOfTheDay";
import { BottomNavigation } from "@/components/BottomNavigation";
import { GuardianAngelDialog } from "@/components/GuardianAngelDialog";
import { StreakMilestoneShare } from "@/components/StreakMilestoneShare";
import { CompletionCongratulationsModal } from "@/components/CompletionCongratulationsModal";
import { useCompletionTracking } from "@/hooks/useCompletionTracking";
import { Settings as SettingsIcon, BookOpen, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import orthodoxCrossLight from "@/assets/orthodox-cross-light.png";
import { useTheme } from "next-themes";
import { populateInitialVerses } from "@/scripts/populateInitialVerses";
import { checkStreakOnAppOpen, GuardianAngelResult } from "@/utils/streakManager";

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { completionStatus, checkCompletion, resetAllProgress } = useCompletionTracking();
  const [streakDays, setStreakDays] = useState<number | null>(() => {
    // Try to get cached streak from sessionStorage for instant display
    const cached = sessionStorage.getItem('cached_streak');
    return cached ? parseInt(cached, 10) : null;
  });
  const [loadingStreak, setLoadingStreak] = useState(false);
  const [hasAnyProgress, setHasAnyProgress] = useState(false);
  const [loadingReading, setLoadingReading] = useState(false);
  const [guardianAngelResult, setGuardianAngelResult] = useState<GuardianAngelResult | null>(null);
  const [showGuardianAngelDialog, setShowGuardianAngelDialog] = useState(false);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [milestoneStreak, setMilestoneStreak] = useState(0);
  const [lastReading, setLastReading] = useState<{
    title: string;
    passage: string;
    progress: number;
    bookKey?: string;
    chapter?: number;
    totalChapters?: number;
    bookProgress?: number;
  } | null>(null);

  useEffect(() => {
    // Populate initial verses on first load
    const checkAndPopulate = async () => {
      if (!user) return;
      
      const hasPopulated = localStorage.getItem('bible_verses_populated');
      
      if (!hasPopulated) {
        console.log('Populating initial Bible verses...');
        try {
          await populateInitialVerses();
          localStorage.setItem('bible_verses_populated', 'true');
          console.log('Initial verses populated successfully');
        } catch (error) {
          console.error('Error populating verses:', error);
        }
      }
    };

    if (user) {
      checkAndPopulate();
      fetchStreak();
      fetchLastReading();
    }
  }, [user]);

  // Check for 100% completion
  useEffect(() => {
    if (completionStatus.allComplete && user) {
      const hasShownCompletion = localStorage.getItem(`completion_shown_${user.id}`);
      if (!hasShownCompletion) {
        setShowCompletionDialog(true);
        localStorage.setItem(`completion_shown_${user.id}`, 'true');
      }
    }
  }, [completionStatus.allComplete, user]);

  const fetchStreak = async () => {
    if (!user) return;
    
    // Only show loading if we don't have cached data
    if (streakDays === null) {
      setLoadingStreak(true);
    }
    
    try {
      // First check if guardian angel needs to intervene
      const angelResult = await checkStreakOnAppOpen(user.id);
      
      if (angelResult) {
        setGuardianAngelResult(angelResult);
        setShowGuardianAngelDialog(true);
        setStreakDays(angelResult.newStreak);
        sessionStorage.setItem('cached_streak', angelResult.newStreak.toString());
        return;
      }
      
      // Otherwise just fetch current streak
      const { data } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        const currentStreak = data.current_streak;
        setStreakDays(currentStreak);
        sessionStorage.setItem('cached_streak', currentStreak.toString());
        
        // Check if this is a milestone (increases by 25 days)
        if (currentStreak > 0 && currentStreak % 25 === 0) {
          const lastShownMilestone = localStorage.getItem(`milestone_shown_${user.id}`);
          const lastShown = lastShownMilestone ? parseInt(lastShownMilestone) : 0;
          
          // Only show if this specific milestone hasn't been shown before
          if (currentStreak > lastShown) {
            setMilestoneStreak(currentStreak);
            setShowMilestoneDialog(true);
            localStorage.setItem(`milestone_shown_${user.id}`, currentStreak.toString());
          }
        }
      } else {
        // No streak data yet, set to 0
        setStreakDays(0);
        sessionStorage.setItem('cached_streak', '0');
      }
    } finally {
      setLoadingStreak(false);
    }
  };

  const fetchLastReading = async () => {
    if (!user) return;

    setLoadingReading(true);
    
    // Check if user has any completed chapters
    const { data: anyCompleted, count } = await supabase
      .from('completed_chapters')
      .select('*', { count: 'exact', head: false })
      .eq('user_id', user.id)
      .limit(1);
    
    setHasAnyProgress((count ?? 0) > 0);

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

      // Get all completed chapters for this book to calculate book progress
      const { data: completedInBook } = await supabase
        .from('completed_chapters')
        .select('chapter')
        .eq('user_id', user.id)
        .eq('book_key', bookKey);

      const completedChaptersCount = completedInBook?.length || 0;
      const bookProgressPercentage = Math.round((completedChaptersCount / totalChapters) * 100);

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
        totalChapters: totalChapters,
        bookProgress: bookProgressPercentage
      });
    } else {
      // No completed chapters, set default
      setLastReading({
        title: "Gospel of John",
        passage: "John 1",
        progress: 0,
        bookKey: "John",
        chapter: 1,
        totalChapters: 21,
        bookProgress: 0
      });
    }
    
    setLoadingReading(false);
  };

  // Reload data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchStreak();
        const fetchLastReadingOnVisibility = async () => {
          // Check if user has any completed chapters
          const { data: anyCompleted, count } = await supabase
            .from('completed_chapters')
            .select('*', { count: 'exact', head: false })
            .eq('user_id', user.id)
            .limit(1);
          
          setHasAnyProgress((count ?? 0) > 0);

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

            // Get all completed chapters for this book
            const { data: completedInBook } = await supabase
              .from('completed_chapters')
              .select('chapter')
              .eq('user_id', user.id)
              .eq('book_key', bookKey);

            const completedChaptersCount = completedInBook?.length || 0;
            const bookProgressPercentage = Math.round((completedChaptersCount / totalChapters) * 100);

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
              totalChapters: totalChapters,
              bookProgress: bookProgressPercentage
            });
          } else {
            // No completed chapters, set default
            setLastReading({
              title: "Gospel of John",
              passage: "John 1",
              progress: 0,
              bookKey: "John",
              chapter: 1,
              totalChapters: 21,
              bookProgress: 0
            });
          }
        };

        fetchLastReadingOnVisibility();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  
  return (
    <div className="min-h-screen gradient-peaceful pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm safe-top">
        <div className="container mx-auto px-4 lg:px-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 flex items-center justify-center p-1.5 ${theme === 'light' ? 'bg-black rounded-2xl' : 'bg-background rounded-lg'}`}>
                <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <nav className="flex items-center gap-1">
              <DonateButton />
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Streak Section */}
        <section className="flex justify-center py-8">
          {loadingStreak ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2 flex flex-col items-center">
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ) : (
            streakDays !== null && <StreakFlame days={streakDays} size="lg" />
          )}
        </section>

        {/* Continue Reading */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Continue Reading</h2>
          {loadingReading ? (
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : lastReading ? (
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Continue Reading</p>
                      <h3 className="text-2xl font-bold">
                        {lastReading.title}
                      </h3>
                      <p className="text-lg text-muted-foreground mt-1">
                        {lastReading.passage}
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  
                  {/* Book Progress Bar */}
                  {hasAnyProgress && lastReading.bookProgress !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Book Progress</span>
                        <span className="font-medium">{lastReading.bookProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${lastReading.bookProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Chapter Progress Bar */}
                  {hasAnyProgress && lastReading.progress > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Chapter Progress</span>
                        <span className="font-medium">{lastReading.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-secondary rounded-full h-2 transition-all"
                          style={{ width: `${lastReading.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => {
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
          ) : null}
        </section>

        {/* Journal */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Journal</h2>
          <Journal />
        </section>

        {/* Additional Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Verse of the Day */}
          <VerseOfTheDay />

          {/* Fasting Calendar */}
          <FastingCalendar />
        </div>
      </main>

      <BottomNavigation />

      {/* Guardian Angel Dialog */}
      {guardianAngelResult && (
        <GuardianAngelDialog
          open={showGuardianAngelDialog}
          onOpenChange={setShowGuardianAngelDialog}
          saved={guardianAngelResult.saved}
          streakDays={guardianAngelResult.newStreak}
          savesCount={guardianAngelResult.savesCount}
          remainingPercentage={guardianAngelResult.remainingPercentage}
        />
      )}

      {/* Streak Milestone Dialog */}
      <StreakMilestoneShare
        open={showMilestoneDialog}
        onOpenChange={setShowMilestoneDialog}
        streakDays={milestoneStreak}
      />

      {/* 100% Completion Congratulations Dialog */}
      <CompletionCongratulationsModal
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
        onReset={async () => {
          const success = await resetAllProgress();
          if (success) {
            toast({
              title: "Progress Reset",
              description: "All your progress has been reset. Start your journey anew!",
            });
            // Refresh the page data
            fetchStreak();
            fetchLastReading();
            checkCompletion();
            // Clear the completion shown flag
            if (user) {
              localStorage.removeItem(`completion_shown_${user.id}`);
            }
          } else {
            toast({
              title: "Error",
              description: "Failed to reset progress. Please try again.",
              variant: "destructive",
            });
          }
        }}
      />

      {/* Donation Prompt Dialog - shows every 7 days */}
      <DonationPromptDialog />
    </div>
  );
};

export default Dashboard;
