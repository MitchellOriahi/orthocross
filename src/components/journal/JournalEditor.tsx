import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Highlighter, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  isSaving: boolean;
}

const HIGHLIGHT_COLORS = [
  { name: "Yellow", class: "bg-yellow-200 dark:bg-yellow-900/50" },
  { name: "Green", class: "bg-green-200 dark:bg-green-900/50" },
  { name: "Blue", class: "bg-blue-200 dark:bg-blue-900/50" },
  { name: "Pink", class: "bg-pink-200 dark:bg-pink-900/50" },
];

export const JournalEditor = ({
  title,
  content,
  onTitleChange,
  onContentChange,
  isSaving,
}: JournalEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showHighlighter, setShowHighlighter] = useState(false);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);

  const handleHighlight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === end) {
      setShowHighlighter(!showHighlighter);
      return;
    }

    const selectedText = content.substring(start, end);
    const highlightedText = `<mark class="${selectedColor.class}">${selectedText}</mark>`;
    
    const newContent =
      content.substring(0, start) + highlightedText + content.substring(end);
    
    onContentChange(newContent);
    setShowHighlighter(false);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleHighlight}
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
                    color.class
                  )}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>
        
        {isSaving && (
          <span className="text-xs text-muted-foreground ml-auto">
            Saving...
          </span>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-6">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Title"
          className="text-2xl font-bold border-none bg-transparent px-0 mb-4 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Start writing..."
          className="min-h-[calc(100vh-300px)] resize-none border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed"
        />
      </div>
    </div>
  );
};
