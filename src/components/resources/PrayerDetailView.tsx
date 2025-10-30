import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Highlighter } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { TextToSpeechPlayer } from "@/components/TextToSpeechPlayer";

interface PrayerDetailViewProps {
  name: string;
  title: string;
  content: string[];
  onClose: () => void;
  prayerId: string;
}

const HIGHLIGHT_COLORS = [
  { name: "Yellow", class: "bg-yellow-200 dark:bg-yellow-900/50", value: "yellow" },
  { name: "Green", class: "bg-green-200 dark:bg-green-900/50", value: "green" },
  { name: "Blue", class: "bg-blue-200 dark:bg-blue-900/50", value: "blue" },
  { name: "Pink", class: "bg-pink-200 dark:bg-pink-900/50", value: "pink" },
];

export const PrayerDetailView = ({ name, title, content, onClose, prayerId }: PrayerDetailViewProps) => {
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
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 safe-top">
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
                  <TextToSpeechPlayer 
                    text={explanationContent.join('\n\n')}
                  />
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
                    prayerId={prayerId}
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
  prayerId: string;
}

const ExplanationView = ({ content, viewMode, prayerId }: ExplanationViewProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<Record<number, string>>({});
  const [showHighlighter, setShowHighlighter] = useState(false);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);

  // Split content into sentences
  const allSentences = content.flatMap(paragraph => 
    paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
  );

  const totalPages = content.length;

  // Load highlights
  useEffect(() => {
    if (!user) return;

    const loadHighlights = async () => {
      const { data } = await supabase
        .from('prayer_highlights')
        .select('*')
        .eq('user_id', user.id)
        .eq('prayer_id', prayerId);

      if (data) {
        const highlightMap: Record<number, string> = {};
        data.forEach(h => {
          highlightMap[h.sentence_index] = h.highlight_color;
        });
        setHighlights(highlightMap);
      }
    };

    loadHighlights();
  }, [user, prayerId]);

  const handleSentenceClick = async (sentenceIndex: number) => {
    if (!user) return;

    const currentHighlight = highlights[sentenceIndex];
    
    if (currentHighlight) {
      // Remove highlight
      await supabase
        .from('prayer_highlights')
        .delete()
        .eq('user_id', user.id)
        .eq('prayer_id', prayerId)
        .eq('sentence_index', sentenceIndex);
      
      const newHighlights = { ...highlights };
      delete newHighlights[sentenceIndex];
      setHighlights(newHighlights);
    } else {
      // Add highlight
      await supabase
        .from('prayer_highlights')
        .upsert({
          user_id: user.id,
          prayer_id: prayerId,
          sentence_index: sentenceIndex,
          highlight_color: selectedColor.value,
        });
      
      setHighlights({
        ...highlights,
        [sentenceIndex]: selectedColor.value,
      });
    }
  };

  const getHighlightClass = (color: string) => {
    const colorObj = HIGHLIGHT_COLORS.find(c => c.value === color);
    return colorObj?.class || '';
  };

  const getSentencesInParagraph = (paragraphIndex: number) => {
    let sentenceCount = 0;
    for (let i = 0; i < paragraphIndex; i++) {
      sentenceCount += content[i].split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0).length;
    }
    return sentenceCount;
  };

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
      <div>
        <div className="flex justify-start mb-4">
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
        </div>

        <div className="prose dark:prose-invert max-w-none">
          {content.map((paragraph, paragraphIndex) => {
            const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
            const startSentenceIndex = getSentencesInParagraph(paragraphIndex);
            
            return (
              <div key={paragraphIndex} className="mb-6">
                <div className="text-base sm:text-lg leading-relaxed">
                  {sentences.map((sentence, sentenceIndex) => {
                    const globalIndex = startSentenceIndex + sentenceIndex;
                    const highlight = highlights[globalIndex];
                    
                    return (
                      <span
                        key={sentenceIndex}
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
                {paragraphIndex < content.length - 1 && (
                  <div className="h-px bg-border/50 my-6" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
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

      <div 
        ref={contentRef}
        className="prose dark:prose-invert max-w-none mb-8 min-h-[300px] sm:min-h-[400px]"
      >
        <div className="text-base sm:text-lg leading-relaxed">
          {content[currentPage].split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0).map((sentence, sentenceIndex) => {
            const startIndex = getSentencesInParagraph(currentPage);
            const globalIndex = startIndex + sentenceIndex;
            const highlight = highlights[globalIndex];
            
            return (
              <span
                key={sentenceIndex}
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
