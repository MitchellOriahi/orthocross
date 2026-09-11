import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Highlighter, BookOpen, Scroll } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export interface SlideImage {
  src: string;
  alt: string;
  credit?: string;
}

interface PaginatedReadingProps {
  content: string;
  onComplete: () => void;
  iconUrl?: string;
  campaignId: string;
  islandId: string;
  // Optional per-paragraph imagery, keyed by paragraph index in the reading.
  // A slide shows the image of the nearest paragraph at or before its first
  // sentence, so an image "carries" until the story moves on.
  slideImages?: Record<number, SlideImage>;
}

const HIGHLIGHT_COLORS = [
  { name: "Yellow", class: "bg-yellow-200 dark:bg-yellow-900/50", value: "yellow" },
  { name: "Green", class: "bg-green-200 dark:bg-green-900/50", value: "green" },
  { name: "Blue", class: "bg-blue-200 dark:bg-blue-900/50", value: "blue" },
  { name: "Pink", class: "bg-pink-200 dark:bg-pink-900/50", value: "pink" },
];

const WORDS_PER_SLIDE = 80; // Target words per slide for consistent sizing

// Readings may mark key terms as **term** — rendered bold, never altering the words
const renderEmphasis = (sentence: string) =>
  sentence.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-bold text-primary">{part}</strong> : part
  );

export const PaginatedReading = ({ content, onComplete, iconUrl, campaignId, islandId, slideImages }: PaginatedReadingProps) => {
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

  const [emblaRef, emblaApi] = useEmblaCarousel({ duration: 35, align: 'start' });

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('history-view-mode', viewMode);
  }, [viewMode]);

  const { paragraphsWithSentences, pages, pageParagraph } = useMemo(() => {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    const paragraphsWithSentences = paragraphs.map(para =>
      para.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
    );

    // Flatten, remembering which paragraph each sentence belongs to
    const allSentences: { text: string; para: number }[] = [];
    paragraphsWithSentences.forEach((sentences, para) => {
      sentences.forEach(text => allSentences.push({ text, para }));
    });

    // Group sentences into pages - each page ends with a complete sentence
    const pages: string[][] = [];
    const pageParagraph: number[] = []; // paragraph index of each page's first sentence
    let currentPageSentences: string[] = [];
    let currentPagePara = 0;
    let currentWordCount = 0;

    allSentences.forEach(({ text, para }) => {
      const sentenceWordCount = text.split(/\s+/).length;
      if (currentWordCount + sentenceWordCount > WORDS_PER_SLIDE && currentPageSentences.length > 0) {
        pages.push([...currentPageSentences]);
        pageParagraph.push(currentPagePara);
        currentPageSentences = [text];
        currentPagePara = para;
        currentWordCount = sentenceWordCount;
      } else {
        if (currentPageSentences.length === 0) currentPagePara = para;
        currentPageSentences.push(text);
        currentWordCount += sentenceWordCount;
      }
    });
    if (currentPageSentences.length > 0) {
      pages.push(currentPageSentences);
      pageParagraph.push(currentPagePara);
    }

    return { paragraphsWithSentences, pages, pageParagraph };
  }, [content]);

  const pageSentences = pages;
  const totalPages = pages.length;
  const progressPercentage = ((currentPage + 1) / totalPages) * 100;

  // Resolve the artwork for a page: nearest paragraph image at or before it
  const imageForPage = useCallback((pageIdx: number): SlideImage | null => {
    if (slideImages) {
      for (let para = pageParagraph[pageIdx] ?? 0; para >= 0; para--) {
        if (slideImages[para]) return slideImages[para];
      }
    }
    return iconUrl ? { src: iconUrl, alt: 'Historical Icon' } : null;
  }, [slideImages, pageParagraph, iconUrl]);

  const currentImage = imageForPage(currentPage);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentPage(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

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
      emblaApi?.scrollNext();
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    emblaApi?.scrollPrev();
  };

  return (
    <Card className="p-6 sm:p-8 animate-chapter-open">
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
          <Progress value={progressPercentage} className="h-1.5" />
        )}
      </div>

      {viewMode === 'paginated' ? (
        <>
          {currentImage && (
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-sm aspect-[4/3] sm:w-64 sm:h-64 sm:aspect-auto rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg relative">
                <img
                  key={currentImage.src}
                  src={currentImage.src}
                  alt={currentImage.alt}
                  className="w-full h-full object-cover animate-image-in animate-kenburns"
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                />
                {currentImage.credit && (
                  <span className="absolute bottom-1 right-2 text-[10px] text-white/70 drop-shadow-sm">
                    {currentImage.credit}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="overflow-hidden mb-6" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {pageSentences.map((sentences, pageIdx) => (
                <div
                  key={pageIdx}
                  className={cn(
                    "min-w-0 flex-[0_0_100%] transition-opacity duration-500",
                    pageIdx === currentPage ? "opacity-100" : "opacity-30"
                  )}
                >
                  <div
                    ref={pageIdx === currentPage ? contentRef : undefined}
                    className="prose dark:prose-invert max-w-none min-h-[280px] flex items-start px-1"
                  >
                    <div className="text-base sm:text-lg leading-relaxed space-y-3">
                      {sentences.map((sentence, idx) => {
                        const globalIndex = getSentenceIndex(pageIdx, idx);
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
                            {renderEmphasis(sentence)}{' '}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && totalPages <= 12 && (
            <div className="flex justify-center gap-1.5 mb-5" aria-hidden="true">
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  tabIndex={-1}
                  onClick={() => emblaApi?.scrollTo(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === currentPage ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}

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
          {iconUrl && (
            <div className="flex justify-center mb-6">
              <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg">
                <img src={iconUrl} alt="Historical Icon" className="w-full h-full object-cover" loading="eager" decoding="sync" fetchPriority="high" />
              </div>
            </div>
          )}
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
