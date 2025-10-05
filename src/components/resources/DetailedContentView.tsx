import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DetailedContentViewProps {
  title: string;
  subtitle: string;
  content: string[];
  onClose: () => void;
  showProgress?: boolean;
  onComplete?: () => void;
}

export const DetailedContentView = ({ title, subtitle, content, onClose, showProgress = false, onComplete }: DetailedContentViewProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'paginated' | 'scroll'>('paginated');

  const totalPages = content.length;
  const progressPercentage = ((currentPage + 1) / totalPages) * 100;
  const isComplete = currentPage === totalPages - 1;

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'paginated' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('paginated')}
              >
                Pages
              </Button>
              <Button
                variant={viewMode === 'scroll' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('scroll')}
              >
                Scroll
              </Button>
            </div>
          </div>
          
          {showProgress && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Reading Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl pb-20">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            {title}
          </h1>
          <p className="text-xl text-muted-foreground">{subtitle}</p>
        </div>

        {viewMode === 'paginated' ? (
          <Card className="p-4 sm:p-8">
            <div className="flex justify-end mb-4">
              <div className="text-sm font-medium text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                Page {currentPage + 1} of {totalPages}
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none mb-8 min-h-[300px] sm:min-h-[500px]">
              <p className="text-base sm:text-lg leading-relaxed whitespace-pre-line">
                {content[currentPage]}
              </p>
            </div>

            <div className="pt-6 border-t space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Button
                  onClick={handlePrev}
                  disabled={currentPage === 0}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <ChevronLeft className="w-5 h-5 sm:mr-2" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                {showProgress && isComplete && onComplete ? (
                  <Button
                    onClick={onComplete}
                    size="lg"
                    variant="sacred"
                    className="flex-1"
                  >
                    <Check className="w-5 h-5 sm:mr-2" />
                    <span className="hidden sm:inline">Finish</span>
                  </Button>
                ) : !showProgress && isComplete ? (
                  <Button
                    onClick={onClose}
                    size="lg"
                    variant="sacred"
                    className="flex-1"
                  >
                    <Check className="w-5 h-5 sm:mr-2" />
                    <span className="hidden sm:inline">Finish</span>
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={currentPage === totalPages - 1}
                    size="lg"
                    className="flex-1"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-5 h-5 sm:ml-2" />
                  </Button>
                )}
              </div>

              <div className="flex gap-2 justify-center">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentPage
                        ? 'bg-primary w-8'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4 sm:p-8">
            <div className="prose dark:prose-invert max-w-none">
              {content.map((paragraph, index) => (
                <div key={index} className="mb-6">
                  <p className="text-base sm:text-lg leading-relaxed whitespace-pre-line">
                    {paragraph}
                  </p>
                  {index < content.length - 1 && (
                    <div className="h-px bg-border/50 my-6" />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-6 pt-6 border-t">
              <Button
                onClick={showProgress && onComplete ? onComplete : onClose}
                size="lg"
                variant="sacred"
              >
                <Check className="w-5 h-5 mr-2" />
                Finish
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};
