import { Book, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface DailyReadingCardProps {
  title: string;
  passage: string;
  completed?: boolean;
  progress?: number;
  onStartReading?: () => void;
}

export const DailyReadingCard = ({ 
  title, 
  passage, 
  completed = false, 
  progress = 0,
  onStartReading 
}: DailyReadingCardProps) => {
  return (
    <Card className="shadow-elevated hover:shadow-sacred transition-smooth border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Book className="w-4 h-4" />
              {passage}
            </CardDescription>
          </div>
          {completed && (
            <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!completed && progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        {!completed && (
          <Button 
            variant="sacred" 
            className="w-full"
            onClick={onStartReading}
          >
            {progress > 0 ? 'Continue Reading' : 'Start Reading'}
          </Button>
        )}
        {completed && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onStartReading}
          >
            Read Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
