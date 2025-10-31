import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Highlighter, BookOpen, Scroll } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<'paginated' | 'scroll'>(() => {
    const saved = localStorage.getItem('history-view-mode');
    return (saved as 'paginated' | 'scroll') || 'paginated';
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('history-view-mode', viewMode);
  }, [viewMode]);

  // Split content into paragraphs first
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // Split each paragraph into sentences
  const paragraphsWithSentences = paragraphs.map(para => 
    para.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
  );
  
  // Flatten for pagination
  const allSentences = paragraphsWithSentences.flat();
  
  // Group sentences into pages - each page ends with a complete sentence
  const pages: string[][] = [];
  let currentPageSentences: string[] = [];
  let currentWordCount = 0;
  
  allSentences.forEach(sentence => {
    const sentenceWordCount = sentence.split(/\s+/).length;
    
    // If adding this sentence would exceed the limit AND we already have sentences on this page,
    // start a new page with this sentence instead
    if (currentWordCount + sentenceWordCount > WORDS_PER_SLIDE && currentPageSentences.length > 0) {
      // Complete current page with the sentences we have
      pages.push([...currentPageSentences]);
      // Start new page with the current sentence
      currentPageSentences = [sentence];
      currentWordCount = sentenceWordCount;
    } else {
      // Add sentence to current page
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
  const progressPercentage = ((currentPage + 1) / totalPages) * 100;

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
      <div className="space-y-4 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
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
            
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                variant={viewMode === 'paginated' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('paginated')}
                className="h-7 px-2"
              >
                <BookOpen className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'scroll' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('scroll')}
                className="h-7 px-2"
              >
                <Scroll className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {viewMode === 'paginated' && (
            <div className="text-xs sm:text-sm font-medium text-muted-foreground bg-primary/10 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
              <span className="hidden sm:inline">Page </span>{currentPage + 1}<span className="hidden sm:inline"> of</span><span className="sm:hidden">/</span> {totalPages}
            </div>
          )}
        </div>
        
        {viewMode === 'paginated' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Reading Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </div>
      
      {iconUrl && (
        <div className="flex justify-center mb-6">
          <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg">
            <img src={iconUrl} alt="Historical Icon" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
      
      {viewMode === 'paginated' ? (
        <>
          <div 
            ref={contentRef}
            className="prose dark:prose-invert max-w-none mb-8 min-h-[400px] flex items-start"
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
        </>
      ) : (
        <>
          <ScrollArea className="h-[600px] pr-4">
            <div className="prose dark:prose-invert max-w-none">
              <div className="text-base sm:text-lg leading-relaxed">
                {paragraphsWithSentences.map((sentences, paraIdx) => {
                  // Calculate the starting sentence index for this paragraph
                  let sentenceOffset = 0;
                  for (let i = 0; i < paraIdx; i++) {
                    sentenceOffset += paragraphsWithSentences[i].length;
                  }
                  
                  return (
                    <div key={paraIdx} className="mb-6">
                      <p className="mb-4">
                        {sentences.map((sentence, sentIdx) => {
                          const globalIdx = sentenceOffset + sentIdx;
                          const highlight = highlights[globalIdx];
                          
                          return (
                            <span
                              key={sentIdx}
                              onClick={() => handleSentenceClick(globalIdx)}
                              className={cn(
                                "cursor-pointer transition-all inline",
                                highlight && getHighlightClass(highlight)
                              )}
                            >
                              {sentence}{' '}
                            </span>
                          );
                        })}
                      </p>
                      {paraIdx < paragraphsWithSentences.length - 1 && (
                        <div className="h-px bg-border/50 my-6" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>

          <div className="mt-6">
            <Button onClick={onComplete} size="lg" className="w-full">
              <span className="truncate">Start Quiz</span>
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};
