import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Book, ChevronDown } from "lucide-react";

interface ChapterSelectorProps {
  book: string;
  totalChapters: number;
  currentChapter: number;
  onChapterChange: (chapter: number) => void;
}

export const ChapterSelector = ({ 
  book, 
  totalChapters, 
  currentChapter, 
  onChapterChange 
}: ChapterSelectorProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="flex items-center gap-3 p-4 bg-card rounded-lg border-2 cursor-pointer hover:bg-accent hover:border-primary transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
          <Book className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex items-center gap-2 flex-1">
            <span className="font-medium">{book}</span>
            <span className="text-muted-foreground">Chapter</span>
            <span className="font-bold text-primary">{currentChapter}</span>
          </div>
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 animate-pulse" />
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <SheetTitle className="text-center">
            {book} - Select Chapter
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(70vh-120px)] mt-6 px-4">
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2 pb-4">
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map((chapter) => (
              <Button
                key={chapter}
                variant={chapter === currentChapter ? "default" : "outline"}
                onClick={() => onChapterChange(chapter)}
                className={`aspect-square p-0 text-base font-semibold ${
                  chapter === currentChapter 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {chapter}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
