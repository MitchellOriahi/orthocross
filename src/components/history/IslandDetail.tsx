import { useState } from "react";
import { ArrowLeft, Heart, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { historyContent } from "@/data/historyContent";
import { useToast } from "@/hooks/use-toast";

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
}

interface IslandDetailProps {
  island: Island;
  campaignId: string;
  onComplete: (campaignId: string, islandId: string, xp: number, score: number) => void;
  onBack: () => void;
  hearts: number;
  setHearts: (hearts: number) => void;
}

export const IslandDetail = ({ island, campaignId, onComplete, onBack, hearts, setHearts }: IslandDetailProps) => {
  const [stage, setStage] = useState<'reading' | 'quiz' | 'complete'>('reading');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [shuffledOptions, setShuffledOptions] = useState<{text: string, originalIndex: number}[][]>([]);
  const { toast } = useToast();

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

    const selectedShuffledIndex = parseInt(selectedAnswer);
    const originalIndex = shuffledOptions[currentQuestion][selectedShuffledIndex].originalIndex;
    const isCorrect = originalIndex === island.quiz[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      // Gain a heart on correct answer (up to max)
      if (hearts < historyContent.maxHearts) {
        setHearts(hearts + 1);
        toast({
          title: "Correct! ✓",
          description: `You gained a heart! ${hearts + 1} hearts.`,
        });
      } else {
        toast({
          title: "Correct! ✓",
          description: "Great job!",
        });
      }
    } else {
      // Lose a heart on wrong answer
      setHearts(hearts - 1);
      toast({
        title: "Incorrect Answer",
        description: `You lost a heart. ${hearts - 1} hearts remaining.`,
        variant: "destructive"
      });
      
      if (hearts - 1 === 0) {
        toast({
          title: "Out of Hearts",
          description: "You've run out of hearts. Try again later!",
          variant: "destructive"
        });
        onBack();
        return;
      }
    }

    const newAnswers = [...answers, originalIndex];
    setAnswers(newAnswers);

    if (currentQuestion < island.quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
    } else {
      // Calculate score
      const correctCount = newAnswers.filter((ans, idx) => ans === island.quiz[idx].correctAnswer).length;
      const score = (correctCount / island.quiz.length) * 100;
      const xpEarned = historyContent.xpPerReading + (correctCount * historyContent.xpPerCorrectAnswer) + (score === 100 ? historyContent.xpPerIslandPerfect : 0);
      
      setStage('complete');
      onComplete(campaignId, island.id, xpEarned, score);
    }
  };

  const progress = ((currentQuestion + 1) / island.quiz.length) * 100;

  return (
    <div className="min-h-screen gradient-peaceful">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Path
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: historyContent.maxHearts }).map((_, i) => (
                <Heart 
                  key={i} 
                  className={`w-5 h-5 ${i < hearts ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">{island.title}</h1>

        {stage === 'reading' && (
          <Card className="p-8">
            <div className="prose dark:prose-invert max-w-none mb-8">
              <p className="text-lg leading-relaxed">{island.reading}</p>
            </div>
            <Button onClick={handleStartQuiz} size="lg" className="w-full">
              Start Quiz
            </Button>
          </Card>
        )}

        {stage === 'quiz' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Question {currentQuestion + 1} of {island.quiz.length}</span>
                <span className="text-sm text-muted-foreground">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} />
            </div>

            <Card className="p-8">
              <h2 className="text-xl font-bold mb-6">{island.quiz[currentQuestion].question}</h2>
              
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

        {stage === 'complete' && (
          <Card className="p-8 text-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="mb-6">
              <Trophy className="w-24 h-24 mx-auto mb-4 text-primary animate-bounce" />
              <h2 className="text-4xl font-bold mb-2 gradient-sacred bg-clip-text text-transparent">
                🎉 Congratulations! 🎉
              </h2>
              <p className="text-xl text-muted-foreground">Island Complete!</p>
            </div>
            
            <div className="bg-card border-2 border-primary rounded-xl p-8 mb-6 shadow-lg">
              <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">You've Earned</p>
              <div className="relative">
                <Shield className="w-32 h-32 mx-auto mb-4 text-primary" />
                <p className="text-3xl font-bold capitalize gradient-sacred bg-clip-text text-transparent">
                  {island.awardPiece.replace(/_/g, ' ')}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">A piece of the Armor of God</p>
            </div>
            
            <Button onClick={onBack} size="lg" className="w-full">
              Continue Your Journey
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

const Trophy = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v3c0 2.21 1.79 4 4 4h.19l1.55 6.21c.16.65.76 1.09 1.43 1.09h5.66c.67 0 1.27-.44 1.43-1.09L18.81 16H19c2.21 0 4-1.79 4-4v-3c0-1.1-.9-2-2-2zM6 14c-1.1 0-2-.9-2-2v-2h2v4zm4 4l-1.5-6H10V6h4v6h1.5l-1.5 6h-4zm8-6c0 1.1-.9 2-2 2v-4h2v2z"/>
  </svg>
);
