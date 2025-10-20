import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Settings as SettingsIcon, Sparkles, Heart, Footprints, Sword, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMusic } from "@/contexts/MusicContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PaginatedReading } from "./PaginatedReading";
import { HistoryHighlightIntro } from "./HistoryHighlightIntro";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import completionCross from "@/assets/completion-cross-hq.png";

interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Island {
  id: string;
  title: string;
  reading: string;
  quiz: Quiz[];
  awardPiece: string;
  iconUrl?: string;
}

interface IslandDetailProps {
  island: Island;
  campaignId: string;
  onComplete: (campaignId: string, islandId: string, score: number) => void;
  onBack: () => void;
}

export const IslandDetail = ({ island, campaignId, onComplete, onBack }: IslandDetailProps) => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'reading' | 'quiz'>('reading');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [shuffledOptions, setShuffledOptions] = useState<{text: string, originalIndex: number}[][]>([]);

  const { toast } = useToast();
  const { playSound } = useMusic();

  const handleStartQuiz = () => {
    const shuffled = island.quiz.map(q => {
      const optionsWithIndex = q.options.map((text, originalIndex) => ({ text, originalIndex }));
      return optionsWithIndex.sort(() => Math.random() - 0.5);
    });
    setShuffledOptions(shuffled);
    setStage('quiz');
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const selectedIndex = parseInt(selectedAnswer);
    const originalIndex = shuffledOptions[currentQuestion][selectedIndex].originalIndex;
    const isCorrect = originalIndex === island.quiz[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      const newAnswers = [...answers, originalIndex];
      setAnswers(newAnswers);

      if (currentQuestion < island.quiz.length - 1) {
        // Not the last question - show toast and continue
        toast({
          title: "Correct! ✓",
          description: "Great job!",
        });
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer('');
      } else {
        // Last question - skip toast and go straight to completion
        const correctCount = newAnswers.filter((ans, idx) => ans === island.quiz[idx].correctAnswer).length;
        const score = (correctCount / island.quiz.length) * 100;
        
        // Play island completion sound
        playSound('island');
        
        setShowCompletionModal(true);
        onComplete(campaignId, island.id, score);
      }
    } else {
      toast({
        title: "Incorrect",
        description: "Try again!",
        variant: "destructive"
      });
      // Don't proceed to next question - user must get it right
      setSelectedAnswer('');
    }
  };

  const progress = ((currentQuestion + 1) / island.quiz.length) * 100;

  const getArmorEmblem = () => {
    const awardName = island.awardPiece.toLowerCase().replace(/_/g, ' ');
    const svgClass = "w-32 h-32 mx-auto";
    
    switch(awardName) {
      case 'sword of the spirit':
        return (
          <svg className={svgClass} viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 5 L60 15 L55 20 L80 75 L75 80 L70 75 L65 80 L60 75 L55 80 L50 75 L45 20 L40 15 Z" className="fill-primary" />
            <rect x="47" y="75" width="6" height="10" rx="3" className="fill-primary" />
          </svg>
        );
      case 'shield of faith':
        return (
          <svg className={svgClass} viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 5 C30 5, 15 15, 15 25 C15 25, 10 40, 10 55 C10 75, 25 90, 50 95 C75 90, 90 75, 90 55 C90 40, 85 25, 85 25 C85 15, 70 5, 50 5 Z M50 15 C65 15, 75 20, 75 27 C75 27, 78 38, 78 52 C78 68, 67 80, 50 85 C33 80, 22 68, 22 52 C22 38, 25 27, 25 27 C25 20, 35 15, 50 15 Z" className="fill-primary" />
          </svg>
        );
      case 'sandals of gospel of peace':
        return (
          <svg className={svgClass} viewBox="0 0 100 100" fill="currentColor">
            <path d="M25 30 L25 50 L20 55 C20 55, 18 58, 20 62 L30 70 C35 73, 40 72, 43 70 L45 50 L40 30 Z M30 35 L35 40 L35 45 L30 45 Z M35 48 L35 53 L30 53 Z M35 56 L35 61 L32 63 Z" className="fill-primary" />
            <ellipse cx="28" cy="65" rx="3" ry="4" className="fill-background" />
          </svg>
        );
      case 'belt of truth':
        return (
          <svg className={svgClass} viewBox="0 0 100 100" fill="currentColor">
            <rect x="10" y="35" width="80" height="15" rx="2" className="fill-primary" />
            <circle cx="50" cy="42.5" r="8" className="fill-background" />
            <circle cx="50" cy="42.5" r="5" className="fill-primary" />
            {/* Hanging straps */}
            <rect x="20" y="50" width="8" height="35" rx="4" className="fill-primary" />
            <rect x="32" y="50" width="6" height="40" rx="3" className="fill-primary" />
            <rect x="42" y="50" width="7" height="37" rx="3.5" className="fill-primary" />
            <rect x="52" y="50" width="7" height="37" rx="3.5" className="fill-primary" />
            <rect x="62" y="50" width="6" height="40" rx="3" className="fill-primary" />
            <rect x="72" y="50" width="8" height="35" rx="4" className="fill-primary" />
          </svg>
        );
      case 'helmet of salvation':
        return (
          <svg className={svgClass} viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 10 C35 10, 25 18, 25 28 L25 65 C25 70, 28 75, 35 75 L35 55 C35 55, 38 48, 42 48 L42 70 L58 70 L58 48 C62 48, 65 55, 65 55 L65 75 C72 75, 75 70, 75 65 L75 28 C75 18, 65 10, 50 10 Z" className="fill-primary" />
            <rect x="35" y="48" width="8" height="3" className="fill-background" />
            <rect x="57" y="48" width="8" height="3" className="fill-background" />
          </svg>
        );
      case 'breastplate of righteousness':
        return (
          <svg className={svgClass} viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 15 L25 20 C22 20, 20 22, 20 25 L20 55 C20 58, 22 62, 25 65 L35 75 C40 78, 45 80, 50 80 C55 80, 60 78, 65 75 L75 65 C78 62, 80 58, 80 55 L80 25 C80 22, 78 20, 75 20 Z M50 22 L50 75 Z" className="fill-primary" />
            <ellipse cx="30" cy="25" rx="3" ry="3" className="fill-background" />
            <ellipse cx="50" cy="25" rx="3" ry="3" className="fill-background" />
            <ellipse cx="70" cy="25" rx="3" ry="3" className="fill-background" />
            <circle cx="38" cy="68" r="4" className="fill-background" />
            <circle cx="50" cy="72" r="4" className="fill-background" />
            <circle cx="62" cy="68" r="4" className="fill-background" />
          </svg>
        );
      case 'full eastern armor':
      case 'eastern armor':
        return (
          <svg className={svgClass} viewBox="0 0 100 100" fill="currentColor">
            {/* Helmet */}
            <path d="M50 8 C38 8, 30 14, 30 22 L30 35 L70 35 L70 22 C70 14, 62 8, 50 8 Z" className="fill-primary" />
            {/* Breastplate */}
            <path d="M25 38 L75 38 L72 65 C72 68, 65 72, 50 72 C35 72, 28 68, 28 65 Z" className="fill-primary" />
            <path d="M50 40 L50 70" stroke="currentColor" strokeWidth="2" className="stroke-background" />
            {/* Belt */}
            <rect x="25" y="65" width="50" height="8" className="fill-primary" />
            <circle cx="50" cy="69" r="4" className="fill-background" />
            {/* Leg armor */}
            <rect x="35" y="73" width="10" height="20" className="fill-primary" />
            <rect x="55" y="73" width="10" height="20" className="fill-primary" />
          </svg>
        );
      case 'full oriental armor':
      case 'oriental armor':
        return (
          <svg className={svgClass} viewBox="0 0 100 100" fill="currentColor">
            {/* Ornate helmet with crest */}
            <path d="M50 5 L45 10 L30 18 L30 30 L70 30 L70 18 L55 10 Z" className="fill-primary" />
            <rect x="48" y="0" width="4" height="10" className="fill-primary" />
            {/* Shoulder plates */}
            <ellipse cx="30" cy="35" rx="8" ry="10" className="fill-primary" />
            <ellipse cx="70" cy="35" rx="8" ry="10" className="fill-primary" />
            {/* Lamellar chest armor */}
            <rect x="32" y="32" width="36" height="8" rx="1" className="fill-primary" />
            <rect x="32" y="40" width="36" height="8" rx="1" className="fill-primary" />
            <rect x="32" y="48" width="36" height="8" rx="1" className="fill-primary" />
            <rect x="32" y="56" width="36" height="8" rx="1" className="fill-primary" />
            {/* Decorative lines */}
            <line x1="40" y1="32" x2="40" y2="64" stroke="currentColor" strokeWidth="1" className="stroke-background" />
            <line x1="50" y1="32" x2="50" y2="64" stroke="currentColor" strokeWidth="1" className="stroke-background" />
            <line x1="60" y1="32" x2="60" y2="64" stroke="currentColor" strokeWidth="1" className="stroke-background" />
            {/* Belt with ornament */}
            <rect x="28" y="64" width="44" height="6" className="fill-primary" />
            <circle cx="50" cy="67" r="3" className="fill-background" />
            {/* Leg guards */}
            <path d="M36 70 L36 92 L42 92 L42 70 Z" className="fill-primary" />
            <path d="M58 70 L58 92 L64 92 L64 70 Z" className="fill-primary" />
          </svg>
        );
      default:
        return <Shield className="w-32 h-32 mx-auto text-primary" />;
    }
  };

  return (
    <div className="min-h-screen gradient-peaceful pb-20">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm safe-top">
        <div className="container mx-auto px-4 lg:px-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center p-1.5">
                <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">History</h1>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-elevated border-border/50">
          <div className="p-4 border-b border-border/50">
            <Button
              variant="ghost"
              onClick={onBack}
            >
              ← Back
            </Button>
          </div>
          <div className="p-6">
            <h2 className="text-3xl font-bold mb-6">{island.title}</h2>
            
            {stage === 'reading' && (
              <>
                <HistoryHighlightIntro />
                <PaginatedReading
                  content={island.reading}
                  onComplete={handleStartQuiz}
                  iconUrl={island.iconUrl}
                  campaignId={campaignId}
                  islandId={island.id}
                />
              </>
            )}

            {stage === 'quiz' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Question {currentQuestion + 1} of {island.quiz.length}</span>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                <Card className="p-8">
                  <h3 className="text-xl font-bold mb-6">{island.quiz[currentQuestion].question}</h3>
                  
                  <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
                    <div className="space-y-4">
                      {shuffledOptions[currentQuestion]?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer"
                             onClick={() => handleAnswerSelect(index.toString())}>
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  <Button 
                    onClick={handleSubmitAnswer} 
                    disabled={!selectedAnswer}
                    size="lg" 
                    className="w-full mt-8"
                  >
                    Submit Answer
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </main>

      <Dialog open={showCompletionModal}>
        <DialogContent 
          className="sm:max-w-md [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <Card className="p-8 text-center bg-gradient-to-br from-primary/40 to-primary/20 border-0 shadow-none">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white dark:bg-card border-2 border-primary flex items-center justify-center p-4">
                <svg 
                  viewBox="0 0 100 100" 
                  className="w-full h-full"
                  fill="currentColor"
                >
                  {/* Orthodox three-bar cross */}
                  {/* Top bar (inscription) */}
                  <rect x="42" y="10" width="16" height="3" className="fill-black dark:fill-white" />
                  {/* Middle vertical bar */}
                  <rect x="47" y="10" width="6" height="80" className="fill-black dark:fill-white" />
                  {/* Middle horizontal bar (longest) */}
                  <rect x="25" y="35" width="50" height="6" className="fill-black dark:fill-white" />
                  {/* Bottom slanted bar */}
                  <rect x="30" y="70" width="40" height="4" transform="rotate(-20 50 72)" className="fill-black dark:fill-white" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold mb-2 text-foreground">
                🎀 Congratulations!
              </h2>
              <p className="text-xl text-muted-foreground">Island Complete!</p>
            </div>


            <div className="bg-white dark:bg-card border-2 border-primary rounded-xl p-6 mb-6 shadow-lg relative">
              <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">You've Earned</p>
              <div className="relative">
                <div className="mb-4">
                  {getArmorEmblem()}
                </div>
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <Sparkles 
                      key={i}
                      className="absolute text-primary animate-ping"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: "1s"
                      }}
                    />
                  ))}
                </div>
              <p className="text-2xl font-bold capitalize relative z-10">
                {island.awardPiece.replace(/_/g, ' ')}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">A piece of the Armor of God</p>
            </div>
            
            <Button 
              onClick={() => {
                setShowCompletionModal(false);
                onBack();
              }} 
              size="lg" 
              className="w-full"
            >
              Continue Your Journey
            </Button>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
};