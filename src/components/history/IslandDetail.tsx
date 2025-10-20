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
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
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
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-background dark:bg-gray-800 border-2 border-primary flex items-center justify-center">
                <img 
                  src={completionCross} 
                  alt="Completion" 
                  className="w-16 h-16 dark:invert"
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
                <Shield className="w-32 h-32 mx-auto mb-4 text-primary" />
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