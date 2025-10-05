import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface JournalEditorProps {
  entryId: string;
  title: string | null;
  content: string | null;
  onUpdate: (entryId: string, title: string, content: string) => void;
  onDelete: (entryId: string) => void;
}

export const JournalEditor = ({
  entryId,
  title,
  content,
  onUpdate,
  onDelete,
}: JournalEditorProps) => {
  const [localTitle, setLocalTitle] = useState(title || "");
  const [localContent, setLocalContent] = useState(content || "");
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalTitle(title || "");
    setLocalContent(content || "");
  }, [entryId, title, content]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localTitle !== title || localContent !== content) {
        setIsSaving(true);
        onUpdate(entryId, localTitle, localContent);
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localTitle, localContent, entryId]);

  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selectedText = localContent.substring(start, end);
      // For now, we'll wrap selected text with markdown bold
      const newContent = 
        localContent.substring(0, start) +
        `**${selectedText}**` +
        localContent.substring(end);
      setLocalContent(newContent);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="border-b border-border p-4 flex items-center justify-between">
        <Input
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="Note Title"
          className="border-0 text-2xl font-semibold px-0 focus-visible:ring-0"
        />
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(entryId)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <Textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onMouseUp={handleTextSelection}
          placeholder="Start typing your note..."
          className="min-h-full border-0 resize-none text-base leading-relaxed focus-visible:ring-0 p-0"
        />
      </div>
      <div className="border-t border-border p-2 text-xs text-muted-foreground text-center">
        Select text and release to highlight (bold)
      </div>
    </div>
  );
};
