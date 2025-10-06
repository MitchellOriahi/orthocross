import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Highlighter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface PaginatedReadingProps {
  content: string;
  onComplete: () => void;
  iconUrl?: string;
  campaignId: string;
  islandId: string;
}

const HIGHLIGHT_COLORS = [
  { name: "Yellow", class: "bg-yellow-200 dark:bg-yellow-900/50", value: "yellow" },
  { name: "Green", class: "bg-green-200 dark:bg-green-900/50", value: "green" },
  { name: "Blue", class: "bg-blue-200 dark:bg-blue-900/50", value: "blue" },
  { name: "Pink", class: "bg-pink-200 dark:bg-pink-900/50", value: "pink" },
];

const WORDS_PER_SLIDE = 80; // Target words per slide for consistent sizing

export const PaginatedReading = ({ content, onComplete, iconUrl, campaignId, islandId }: PaginatedReadingProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [highlights, setHighlights] = useState<Record<number, string>>({});
  const [showHighlighter, setShowHighlighter] = useState(false);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const contentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Split content into sentences first
  const allSentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  
  // Group sentences into pages based on word count
  const pages: string[][] = [];
  let currentPageSentences: string[] = [];
  let currentWordCount = 0;
  
  allSentences.forEach(sentence => {
    const sentenceWordCount = sentence.split(/\s+/).length;
    
    if (currentWordCount + sentenceWordCount > WORDS_PER_SLIDE && currentPageSentences.length > 0) {
      pages.push([...currentPageSentences]);
      currentPageSentences = [sentence];
      currentWordCount = sentenceWordCount;
    } else {
      currentPageSentences.push(sentence);
      currentWordCount += sentenceWordCount;
    }
  });
  
  // Add the last page if it has content
  if (currentPageSentences.length > 0) {
    pages.push(currentPageSentences);
  }
  
  // Create sentence index mapping
  const pageSentences = pages;

  const totalPages = pages.length;

  // Load highlights
  useEffect(() => {
    if (!user) return;

    const loadHighlights = async () => {
      const { data } = await supabase
        .from('history_highlights')
        .select('*')
        .eq('user_id', user.id)
        .eq('campaign_id', campaignId)
        .eq('island_id', islandId);

      if (data) {
        const highlightMap: Record<number, string> = {};
        data.forEach(h => {
          highlightMap[h.sentence_index] = h.highlight_color;
        });
        setHighlights(highlightMap);
      }
    };

    loadHighlights();
  }, [user, campaignId, islandId]);

  const handleSentenceClick = async (sentenceIndex: number) => {
    if (!user) return;

    const currentHighlight = highlights[sentenceIndex];
    
    if (currentHighlight) {
      // Remove highlight
      await supabase
        .from('history_highlights')
        .delete()
        .eq('user_id', user.id)
        .eq('campaign_id', campaignId)
        .eq('island_id', islandId)
        .eq('sentence_index', sentenceIndex);
      
      const newHighlights = { ...highlights };
      delete newHighlights[sentenceIndex];
      setHighlights(newHighlights);
    } else {
      // Add highlight
      await supabase
        .from('history_highlights')
        .upsert({
          user_id: user.id,
          campaign_id: campaignId,
          island_id: islandId,
          sentence_index: sentenceIndex,
          highlight_color: selectedColor.value,
        });
      
      setHighlights({
        ...highlights,
        [sentenceIndex]: selectedColor.value,
      });
    }
  };

  const getSentenceIndex = (pageIndex: number, sentenceIndexInPage: number): number => {
    let totalIndex = 0;
    for (let i = 0; i < pageIndex; i++) {
      totalIndex += pageSentences[i].length;
    }
    return totalIndex + sentenceIndexInPage;
  };

  const getHighlightClass = (color: string) => {
    const colorObj = HIGHLIGHT_COLORS.find(c => c.value === color);
    return colorObj?.class || '';
  };

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


  return (
    <Card className="p-8">
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowHighlighter(!showHighlighter)}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          
          {showHighlighter && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-10 flex gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setSelectedColor(color);
                    setShowHighlighter(false);
                  }}
                  className={cn(
                    "w-6 h-6 rounded border border-border",
                    color.class,
                    selectedColor.value === color.value && "ring-2 ring-primary"
                  )}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="text-xs sm:text-sm font-medium text-muted-foreground bg-primary/10 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
          <span className="hidden sm:inline">Page </span>{currentPage + 1}<span className="hidden sm:inline"> of</span><span className="sm:hidden">/</span> {totalPages}
        </div>
      </div>
      
      {currentPage === 0 && iconUrl && (
        <div className="flex justify-center mb-6">
          <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg">
            <img src={iconUrl} alt="Historical Icon" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
      
      <div 
        ref={contentRef}
        className="prose dark:prose-invert max-w-none mb-8 min-h-[300px]"
      >
        <div className="text-base sm:text-lg leading-relaxed space-y-3">
          {pageSentences[currentPage].map((sentence, idx) => {
            const globalIndex = getSentenceIndex(currentPage, idx);
            const highlight = highlights[globalIndex];
            
            return (
              <span
                key={idx}
                onClick={() => handleSentenceClick(globalIndex)}
                className={cn(
                  "cursor-pointer transition-all inline",
                  highlight && getHighlightClass(highlight)
                )}
              >
                {sentence}{' '}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={handlePrev}
          disabled={currentPage === 0}
          variant="outline"
          size="lg"
          className="min-w-0"
        >
          <ChevronLeft className="w-5 h-5 sm:mr-2 flex-shrink-0" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {currentPage === totalPages - 1 ? (
          <Button onClick={onComplete} size="lg" className="flex-1 min-w-0">
            <span className="truncate">Start Quiz</span>
          </Button>
        ) : (
          <Button onClick={handleNext} size="lg" className="flex-1 min-w-0">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5 sm:ml-2 flex-shrink-0" />
          </Button>
        )}
      </div>
    </Card>
  );
};
