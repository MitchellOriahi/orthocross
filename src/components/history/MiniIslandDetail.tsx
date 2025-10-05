import { useState } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MiniIsland } from "@/data/historyContent";
import { toast } from "sonner";

interface MiniIslandDetailProps {
  miniIsland: MiniIsland;
  onComplete: (xpEarned: number) => void;
  onBack: () => void;
}

export const MiniIslandDetail = ({ miniIsland, onComplete, onBack }: MiniIslandDetailProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleComplete = () => {
    const xpEarned = miniIsland.rewards.xp + (miniIsland.rewards.coins || 0);
    toast.success(`+${xpEarned} XP earned!`);
    onComplete(xpEarned);
  };

  const renderContent = () => {
    switch (miniIsland.type) {
      case "story":
        return (
          <div className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed">{miniIsland.content}</p>
            </div>
            <Button onClick={handleComplete} className="w-full" size="lg">
              Continue <CheckCircle className="ml-2 w-5 h-5" />
            </Button>
          </div>
        );

      case "glossary":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {miniIsland.items?.map((item, idx) => (
                <Card key={idx} className="p-4">
                  <h3 className="font-bold text-lg mb-2">{item.term}</h3>
                  <p className="text-muted-foreground">{item.def}</p>
                </Card>
              ))}
            </div>
            <Button onClick={handleComplete} className="w-full" size="lg">
              Got it! <CheckCircle className="ml-2 w-5 h-5" />
            </Button>
          </div>
        );

      case "people":
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              {miniIsland.people?.map((person, idx) => (
                <Card key={idx} className="p-4">
                  <h3 className="font-bold text-lg mb-2">{person.name}</h3>
                  <p className="text-muted-foreground">{person.description}</p>
                </Card>
              ))}
            </div>
            <Button onClick={handleComplete} className="w-full" size="lg">
              Continue <CheckCircle className="ml-2 w-5 h-5" />
            </Button>
          </div>
        );

      case "quick_quiz":
        if (showResult) {
          const totalQuestions = miniIsland.questions?.length || 1;
          const percentage = (score / totalQuestions) * 100;
          return (
            <div className="space-y-6 text-center">
              <div className="text-6xl">🎉</div>
              <h2 className="text-3xl font-bold">Quiz Complete!</h2>
              <p className="text-xl">
                You got {score} out of {totalQuestions} correct ({percentage.toFixed(0)}%)
              </p>
              <Button onClick={handleComplete} className="w-full" size="lg">
                Continue <CheckCircle className="ml-2 w-5 h-5" />
              </Button>
            </div>
          );
        }

        const question = miniIsland.questions?.[currentQuestion];
        if (!question) return null;

        return (
          <div className="space-y-6">
            <div className="mb-4">
              <Progress value={((currentQuestion + 1) / (miniIsland.questions?.length || 1)) * 100} />
              <p className="text-sm text-muted-foreground mt-2">
                Question {currentQuestion + 1} of {miniIsland.questions?.length}
              </p>
            </div>

            <h3 className="text-xl font-bold mb-4">{question.q}</h3>

            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <Button
                  key={idx}
                  variant={selectedAnswer === idx ? "default" : "outline"}
                  className="w-full text-left justify-start h-auto py-4 px-6"
                  onClick={() => setSelectedAnswer(idx)}
                >
                  {option.text}
                </Button>
              ))}
            </div>

            <Button
              onClick={() => {
                if (selectedAnswer !== null) {
                  const isCorrect = question.options[selectedAnswer]?.isCorrect;
                  if (isCorrect) setScore(score + 1);

                  if (currentQuestion < (miniIsland.questions?.length || 1) - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                    setSelectedAnswer(null);
                  } else {
                    setShowResult(true);
                  }
                }
              }}
              disabled={selectedAnswer === null}
              className="w-full"
              size="lg"
            >
              {currentQuestion < (miniIsland.questions?.length || 1) - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          </div>
        );

      case "reward_chest":
        return (
          <div className="space-y-6 text-center">
            <div className="text-8xl animate-bounce">🎁</div>
            <h2 className="text-3xl font-bold">Reward Chest!</h2>
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-xl">+{miniIsland.rewards.coins} Coins</p>
                {miniIsland.rewards.consumables?.map((item, idx) => (
                  <p key={idx} className="text-lg capitalize">{item.replace(/_/g, " ")}</p>
                ))}
              </div>
            </Card>
            <Button onClick={handleComplete} className="w-full" size="lg">
              Claim Rewards <CheckCircle className="ml-2 w-5 h-5" />
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-4">
            <p>Content type: {miniIsland.type}</p>
            <Button onClick={handleComplete} className="w-full" size="lg">
              Continue <CheckCircle className="ml-2 w-5 h-5" />
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen gradient-peaceful">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{miniIsland.title}</h1>
              <p className="text-sm text-muted-foreground capitalize">{miniIsland.type.replace(/_/g, " ")}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">{renderContent()}</Card>
      </main>
    </div>
  );
};
