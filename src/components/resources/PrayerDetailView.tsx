import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PrayerDetailViewProps {
  name: string;
  title: string;
  content: string[];
  onClose: () => void;
}

export const PrayerDetailView = ({ name, title, content, onClose }: PrayerDetailViewProps) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'paginated' | 'scroll'>(() => {
    // Load saved preference from localStorage
    const saved = localStorage.getItem('prayerExplanationViewMode');
    return (saved === 'scroll' || saved === 'paginated') ? saved : 'paginated';
  });

  // Save view mode preference when it changes
  useEffect(() => {
    localStorage.setItem('prayerExplanationViewMode', viewMode);
  }, [viewMode]);

  // Prayer text is the first item, explanations are the rest
  const prayerText = content[0];
  const explanationContent = content.slice(1);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl pb-20">
        <div className="mb-8">
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground break-words">
              {name}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground break-words">{title}</p>
          </div>
        </div>

        {/* Prayer Text */}
        <Card className="p-4 sm:p-8 mb-6">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-base sm:text-lg leading-relaxed whitespace-pre-line text-center">
              {prayerText}
            </p>
          </div>
        </Card>

        {/* Collapsible Explanation Section */}
        <Collapsible open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
              <span className="text-lg font-semibold">Explanation</span>
              {isExplanationOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t">
                {/* View Mode Toggle */}
                <div className="flex justify-end gap-2 p-4 border-b bg-card/50">
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

                {/* Explanation Content */}
                <div className="p-4">
                  <ExplanationView 
                    content={explanationContent} 
                    viewMode={viewMode} 
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </main>
    </div>
  );
};

// Explanation View Component
interface ExplanationViewProps {
  content: string[];
  viewMode: 'paginated' | 'scroll';
}

const ExplanationView = ({ content, viewMode }: ExplanationViewProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

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

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== 'paginated' || !contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (clickX < halfWidth) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  if (viewMode === 'scroll') {
    return (
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
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <div className="text-xs sm:text-sm font-medium text-muted-foreground bg-primary/10 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
          <span className="hidden sm:inline">Page </span>{currentPage + 1}<span className="hidden sm:inline"> of</span><span className="sm:hidden">/</span> {totalPages}
        </div>
      </div>

      <div 
        ref={contentRef}
        onClick={handleContentClick}
        className="prose dark:prose-invert max-w-none mb-8 min-h-[300px] sm:min-h-[400px] cursor-pointer"
      >
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
            className="flex-1 min-w-0"
          >
            <ChevronLeft className="w-5 h-5 sm:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline truncate">Previous</span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
            size="lg"
            className="flex-1 min-w-0"
          >
            <span className="hidden sm:inline truncate">Next</span>
            <ChevronRight className="w-5 h-5 sm:ml-2 flex-shrink-0" />
          </Button>
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
    </div>
  );
};
