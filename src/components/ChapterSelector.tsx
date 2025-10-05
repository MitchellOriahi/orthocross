import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book } from "lucide-react";

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
    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
      <Book className="w-5 h-5 text-primary" />
      <div className="flex items-center gap-2 flex-1">
        <span className="font-medium">{book}</span>
        <span className="text-muted-foreground">Chapter</span>
        <Select 
          value={currentChapter.toString()} 
          onValueChange={(value) => onChapterChange(parseInt(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map((chapter) => (
              <SelectItem key={chapter} value={chapter.toString()}>
                {chapter}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
