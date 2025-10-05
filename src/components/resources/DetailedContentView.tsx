import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetailedContentViewProps {
  title: string;
  subtitle: string;
  content: string[];
  onClose: () => void;
}

export const DetailedContentView = ({ title, subtitle, content, onClose }: DetailedContentViewProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'paginated' | 'scroll'>('paginated');

  const totalPages = content.length;

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
    <div className="fixed inset-0 z-50 bg-background">
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 gradient-sacred bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-xl text-muted-foreground">{subtitle}</p>
        </div>

        {viewMode === 'paginated' ? (
          <Card className="p-8">
            <div className="flex justify-end mb-4">
              <div className="text-sm font-medium text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                Page {currentPage + 1} of {totalPages}
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none mb-8 min-h-[500px]">
              <p className="text-lg leading-relaxed whitespace-pre-line">
                {content[currentPage]}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 pt-6 border-t">
              <Button
                onClick={handlePrev}
                disabled={currentPage === 0}
                variant="outline"
                size="lg"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
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

              <Button
                onClick={handleNext}
                disabled={currentPage === totalPages - 1}
                size="lg"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-8">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="prose dark:prose-invert max-w-none">
                {content.map((paragraph, index) => (
                  <div key={index} className="mb-6">
                    <p className="text-lg leading-relaxed whitespace-pre-line">
                      {paragraph}
                    </p>
                    {index < content.length - 1 && (
                      <div className="h-px bg-border/50 my-6" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </main>
    </div>
  );
};
