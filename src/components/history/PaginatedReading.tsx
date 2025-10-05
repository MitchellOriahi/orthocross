import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginatedReadingProps {
  content: string;
  onComplete: () => void;
}

const CHARS_PER_PAGE = 1200; // Approximately 200-250 words per page

export const PaginatedReading = ({ content, onComplete }: PaginatedReadingProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Split content into pages
  const pages = [];
  let currentIndex = 0;
  
  while (currentIndex < content.length) {
    let endIndex = currentIndex + CHARS_PER_PAGE;
    
    // Try to break at a sentence or paragraph
    if (endIndex < content.length) {
      const nextPeriod = content.indexOf('. ', endIndex);
      const nextNewline = content.indexOf('\n\n', endIndex);
      
      if (nextPeriod > 0 && nextPeriod < endIndex + 100) {
        endIndex = nextPeriod + 1;
      } else if (nextNewline > 0 && nextNewline < endIndex + 100) {
        endIndex = nextNewline + 1;
      }
    }
    
    pages.push(content.slice(currentIndex, endIndex).trim());
    currentIndex = endIndex;
  }

  const totalPages = pages.length;

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (clickX < halfWidth) {
      // Clicked on left side - go to previous page
      handlePrev();
    } else {
      // Clicked on right side - go to next page
      handleNext();
    }
  };

  return (
    <Card className="p-8">
      <div className="flex justify-end mb-4">
        <div className="text-sm font-medium text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
          Page {currentPage + 1} of {totalPages}
        </div>
      </div>
      
      <div 
        ref={contentRef}
        onClick={handleContentClick}
        className="prose dark:prose-invert max-w-none mb-8 min-h-[400px] cursor-pointer"
      >
        <p className="text-lg leading-relaxed whitespace-pre-line">{pages[currentPage]}</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={handlePrev}
          disabled={currentPage === 0}
          variant="outline"
          size="lg"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Previous
        </Button>

        {currentPage === totalPages - 1 ? (
          <Button onClick={onComplete} size="lg" className="flex-1">
            Start Quiz
          </Button>
        ) : (
          <Button onClick={handleNext} size="lg" className="flex-1">
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </Card>
  );
};
