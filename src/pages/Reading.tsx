import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, BookOpen, Type, ChevronLeft, ChevronRight, Scroll } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CongratulationsModal } from "@/components/CongratulationsModal";
import { ThemeToggle } from "@/components/ThemeToggle";

const Reading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState([16]);
  const [currentReading, setCurrentReading] = useState({
    title: "Gospel of John",
    passage: "John 1:1-14"
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [readingMode, setReadingMode] = useState<"scroll" | "pages">("pages");
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [isNewStreak, setIsNewStreak] = useState(false);

  // Reading content mapping
  const readingContent: Record<string, string> = {
    "John 3:1-21": `Now there was a Pharisee, a man named Nicodemus who was a member of the Jewish ruling council. He came to Jesus at night and said, "Rabbi, we know that you are a teacher who has come from God. For no one could perform the signs you are doing if God were not with him."

Jesus replied, "Very truly I tell you, no one can see the kingdom of God unless they are born again."

"How can someone be born when they are old?" Nicodemus asked. "Surely they cannot enter a second time into their mother's womb to be born!"

Jesus answered, "Very truly I tell you, no one can enter the kingdom of God unless they are born of water and the Spirit. Flesh gives birth to flesh, but the Spirit gives birth to spirit. You should not be surprised at my saying, 'You must be born again.' The wind blows wherever it pleases. You hear its sound, but you cannot tell where it comes from or where it is going. So it is with everyone born of the Spirit."

For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.`,
    
    "Psalm 23": `The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul. He guides me along the right paths for his name's sake.

Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.

You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows. Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever.`,
    
    "Proverbs 3:1-12": `My son, do not forget my teaching, but keep my commands in your heart, for they will prolong your life many years and bring you peace and prosperity.

Let love and faithfulness never leave you; bind them around your neck, write them on the tablet of your heart. Then you will win favor and a good name in the sight of God and man.

Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.

Do not be wise in your own eyes; fear the Lord and shun evil. This will bring health to your body and nourishment to your bones.`,
    
    "John 1:1-14": `In the beginning was the Word, and the Word was with God, and the Word was God. He was in the beginning with God. All things were made through Him, and without Him nothing was made that was made. In Him was life, and the life was the light of men. And the light shines in the darkness, and the darkness did not comprehend it.

There was a man sent from God, whose name was John. This man came for a witness, to bear witness of the Light, that all through him might believe. He was not that Light, but was sent to bear witness of that Light. That was the true Light which gives light to every man coming into the world.

He was in the world, and the world was made through Him, and the world did not know Him. He came to His own, and His own did not receive Him. But as many as received Him, to them He gave the right to become children of God, to those who believe in His name: who were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God.

And the Word became flesh and dwelt among us, and we beheld His glory, the glory as of the only begotten of the Father, full of grace and truth.`
  };

  // Load reading from location state or database
  useEffect(() => {
    if (location.state?.title && location.state?.passage) {
      setCurrentReading({
        title: location.state.title,
        passage: location.state.passage
      });
      setProgress(location.state.progress || 0);
    }
  }, [location.state]);

  // Save progress and update streak
  const saveProgress = async (newProgress: number) => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('scripture_title', currentReading.title)
        .eq('scripture_passage', currentReading.passage)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('reading_progress')
          .update({
            progress: newProgress,
            completed: newProgress >= 100,
            last_read_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('reading_progress')
          .insert({
            user_id: user.id,
            scripture_title: currentReading.title,
            scripture_passage: currentReading.passage,
            progress: newProgress,
            completed: newProgress >= 100
          });
      }

      // Update streak if completed
      if (newProgress >= 100) {
        await updateStreak();
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Update user streak
  const updateStreak = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingStreak) {
        // First time completing
        await supabase
          .from('user_streaks')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_completion_date: today
          });
        setStreakDays(1);
        setIsNewStreak(true);
        setShowCongratulations(true);
      } else {
        const lastDate = existingStreak.last_completion_date;
        
        // Check if already completed today
        if (lastDate === today) {
          setStreakDays(existingStreak.current_streak);
          setIsNewStreak(false);
          setShowCongratulations(true);
          return;
        }

        // Check if yesterday or streak broken
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const newStreak = lastDate === yesterdayStr 
          ? existingStreak.current_streak + 1 
          : 1;
        
        const newLongest = Math.max(newStreak, existingStreak.longest_streak);

        await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_completion_date: today
          })
          .eq('user_id', user.id);

        setStreakDays(newStreak);
        setIsNewStreak(true);
        setShowCongratulations(true);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const displayText = readingContent[currentReading.passage] || readingContent["John 1:1-14"];
  
  // Split text into pages (roughly 500 characters per page)
  const pages = useMemo(() => {
    const paragraphs = displayText.split('\n\n');
    const pagesArray: string[][] = [[]];
    let currentPageChars = 0;
    let currentPageIndex = 0;

    paragraphs.forEach(paragraph => {
      const paragraphLength = paragraph.length;
      
      if (currentPageChars + paragraphLength > 500 && pagesArray[currentPageIndex].length > 0) {
        currentPageIndex++;
        pagesArray[currentPageIndex] = [];
        currentPageChars = 0;
      }
      
      pagesArray[currentPageIndex].push(paragraph);
      currentPageChars += paragraphLength;
    });

    return pagesArray;
  }, [displayText]);

  const totalPages = pages.length;

  const handleNextPage = async () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      const newProgress = Math.round(((currentPage + 2) / totalPages) * 100);
      setProgress(newProgress);
      await saveProgress(newProgress);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      const newProgress = Math.round((currentPage / totalPages) * 100);
      setProgress(newProgress);
    }
  };

  const handleFinish = async () => {
    setProgress(100);
    await saveProgress(100);
  };

  return (
    <div className="min-h-screen gradient-peaceful">
      <CongratulationsModal
        isOpen={showCongratulations}
        onClose={() => {
          setShowCongratulations(false);
          navigate('/index');
        }}
        streakDays={streakDays}
        isNewStreak={isNewStreak}
      />

      {/* Reading Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{currentReading.title}</h1>
                <p className="text-sm text-muted-foreground">{currentReading.passage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReadingMode(readingMode === "scroll" ? "pages" : "scroll")}
                title={readingMode === "scroll" ? "Switch to pages" : "Switch to scroll"}
              >
                {readingMode === "scroll" ? (
                  <BookOpen className="w-5 h-5" />
                ) : (
                  <Scroll className="w-5 h-5" />
                )}
              </Button>
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-1" />
            {readingMode === "pages" && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Page {currentPage + 1} of {totalPages}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Reading Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-8 shadow-elevated">
          {readingMode === "scroll" ? (
            <article 
              className="prose prose-lg max-w-none leading-relaxed text-foreground"
              style={{ fontSize: `${fontSize}px` }}
            >
              {displayText.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-6 first:mt-0">
                  {paragraph}
                </p>
              ))}
            </article>
          ) : (
            <>
              <article 
                className="prose prose-lg max-w-none leading-relaxed text-foreground min-h-[400px]"
                style={{ fontSize: `${fontSize}px` }}
              >
                {pages[currentPage]?.map((paragraph, index) => (
                  <p key={index} className="mb-6 first:mt-0">
                    {paragraph}
                  </p>
                ))}
              </article>
              
              {/* Page Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {currentPage + 1} / {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Reading Controls */}
        <div className="mt-8 flex flex-col gap-6">
          <Card className="p-6 shadow-elevated">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Size
                </label>
                <span className="text-sm text-muted-foreground">{fontSize}px</span>
              </div>
              <Slider
                value={fontSize}
                onValueChange={setFontSize}
                min={12}
                max={24}
                step={1}
                className="w-full"
              />
            </div>
          </Card>

          {readingMode === "scroll" ? (
            <Button 
              variant="sacred" 
              size="lg" 
              className="w-full"
              onClick={handleFinish}
            >
              Finish Reading
            </Button>
          ) : (
            <Button 
              variant="sacred" 
              size="lg" 
              className="w-full"
              onClick={currentPage === totalPages - 1 ? handleFinish : handleNextPage}
            >
              {currentPage === totalPages - 1 ? 'Finish' : 'Continue'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reading;
