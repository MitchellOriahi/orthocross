import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Settings as SettingsIcon, Sparkles } from "lucide-react";
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

  const getArmorEmblem = (awardPiece: string) => {
    const normalizedPiece = awardPiece.toLowerCase().replace(/_/g, ' ');
    
    switch (normalizedPiece) {
      case 'sword of spirit':
      case 'sword of the spirit':
        return (
          <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto mb-4 fill-primary">
            <path d="M50 5 L55 40 L60 40 L60 45 L55 45 L60 90 L50 95 L40 90 L45 45 L40 45 L40 40 L45 40 Z"/>
            <rect x="45" y="40" width="10" height="8" className="fill-primary"/>
          </svg>
        );
      
      case 'shield of faith':
        return (
          <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto mb-4 fill-primary">
            <path d="M50 10 L80 25 L80 50 Q80 75 50 90 Q20 75 20 50 L20 25 Z"/>
            <path d="M50 20 L70 30 L70 50 Q70 67 50 80 Q30 67 30 50 L30 30 Z" className="fill-background"/>
          </svg>
        );
      
      case 'sandals of gospel of peace':
      case 'shoes of peace':
        return (
          <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto mb-4 fill-primary">
            <path d="M30 50 Q30 40 35 35 L45 35 L45 45 Q45 55 40 60 L35 65 Q28 68 25 75 L25 85 L45 85 L45 75 Q45 70 40 68 L35 65 Q30 62 30 55 Z"/>
            <ellipse cx="37" cy="45" rx="8" ry="5"/>
          </svg>
        );
      
      case 'belt of truth':
        return (
          <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto mb-4 fill-primary">
            <rect x="10" y="40" width="80" height="15" rx="2"/>
            <rect x="42" y="35" width="16" height="25" rx="3"/>
            <rect x="46" y="38" width="8" height="6" rx="1" className="fill-background"/>
            <rect x="46" y="47" width="8" height="6" rx="1" className="fill-background"/>
            <path d="M48 55 L48 75 M52 55 L52 75" stroke="currentColor" strokeWidth="2" className="stroke-primary"/>
          </svg>
        );
      
      case 'helmet of salvation':
        return (
          <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto mb-4 fill-primary">
            <path d="M50 15 Q30 15 25 35 L25 55 Q25 65 30 70 L70 70 Q75 65 75 55 L75 35 Q70 15 50 15 Z"/>
            <ellipse cx="50" cy="20" rx="20" ry="10"/>
            <rect x="25" y="65" width="50" height="8" rx="2"/>
          </svg>
        );
      
      case 'breastplate of righteousness':
        return (
          <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto mb-4 fill-primary">
            <path d="M30 20 L70 20 L75 30 L75 65 Q75 75 70 80 L60 85 L50 90 L40 85 L30 80 Q25 75 25 65 L25 30 Z"/>
            <path d="M35 30 L65 30 L68 38 L68 65 Q68 72 50 82 Q32 72 32 65 L32 38 Z" className="fill-background"/>
            <line x1="50" y1="30" x2="50" y2="80" stroke="currentColor" strokeWidth="2" className="stroke-primary"/>
          </svg>
        );
      
      case 'full eastern armor':
        return (
          <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto mb-4 fill-primary">
            <ellipse cx="50" cy="25" rx="18" ry="12"/>
            <rect x="32" y="23" width="36" height="6" rx="2"/>
            <path d="M35 35 L65 35 L70 45 L70 70 Q70 78 50 88 Q30 78 30 70 L30 45 Z"/>
            <rect x="30" y="70" width="40" height="18"/>
            <rect x="20" y="40" width="12" height="35" rx="2"/>
            <rect x="68" y="40" width="12" height="35" rx="2"/>
          </svg>
        );
      
      case 'full oriental armor':
        return (
          <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto mb-4 fill-primary">
            <path d="M50 15 Q35 15 32 28 L32 40 L68 40 L68 28 Q65 15 50 15 Z"/>
            <rect x="30" y="38" width="40" height="4"/>
            <path d="M32 45 L68 45 L72 55 L72 75 Q72 82 50 90 Q28 82 28 75 L28 55 Z"/>
            <circle cx="42" cy="60" r="3" className="fill-background"/>
            <circle cx="50" cy="60" r="3" className="fill-background"/>
            <circle cx="58" cy="60" r="3" className="fill-background"/>
            <rect x="25" y="50" width="10" height="25" rx="2"/>
            <rect x="65" y="50" width="10" height="25" rx="2"/>
          </svg>
        );
      
      default:
        return <Shield className="w-32 h-32 mx-auto mb-4 text-primary" />;
    }
  };

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
          <Card className="p-8 text-center bg-gradient-to-br from-primary/20 to-primary/5 border-0 shadow-none">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white dark:bg-black border-2 border-primary flex items-center justify-center p-4">
                <img 
                  src={completionCross} 
                  alt="Completion" 
                  className="w-full h-full object-contain dark:invert"
                />
              </div>
              <h2 className="text-4xl font-bold mb-2 text-foreground">
                🎀 Congratulations!
              </h2>
              <p className="text-xl text-muted-foreground">Island Complete!</p>
            </div>


            <div className="bg-card border-2 border-primary rounded-xl p-6 mb-6 shadow-lg relative">
              <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">You've Earned</p>
              <div className="relative">
                {getArmorEmblem(island.awardPiece)}
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