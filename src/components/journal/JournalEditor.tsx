import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Highlighter, Pencil, Image as ImageIcon, Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { DrawingCanvas } from "./DrawingCanvas";
import { FileAttachments } from "./FileAttachments";
import { VoiceRecorder } from "./VoiceRecorder";

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
  const [showDrawing, setShowDrawing] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const isMobile = useIsMobile();

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
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Title"
            className={`font-bold border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${
              isMobile ? 'text-xl' : 'text-2xl'
            }`}
          />
        </div>

        <div className="flex-1 p-4 overflow-hidden">
          {showHighlighter && (
            <div className="mb-2 p-2 bg-popover border border-border rounded-lg flex gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setSelectedColor(color);
                    setShowHighlighter(false);
                  }}
                  className={cn(
                    "w-8 h-8 rounded border border-border",
                    color.class
                  )}
                  title={color.name}
                />
              ))}
            </div>
          )}

          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Start writing..."
            className={`resize-none border-none bg-transparent px-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed ${
              isMobile ? 'text-sm' : 'text-base'
            }`}
          />
        </div>

        {isSaving && (
          <div className="px-4 py-1 text-xs text-muted-foreground">
            Saving...
          </div>
        )}

        {/* Bottom Toolbar */}
        <div className="border-t border-border p-2 flex items-center justify-around bg-card/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleHighlight}
            className="h-10 w-10"
          >
            <Highlighter className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDrawing(true)}
            className="h-10 w-10"
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachments(true)}
            className="h-10 w-10"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowVoiceRecorder(true)}
            className="h-10 w-10"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Full-screen Drawing Sheet */}
      <Sheet open={showDrawing} onOpenChange={setShowDrawing}>
        <SheetContent side="bottom" className="h-screen w-screen p-0 max-w-none">
          <SheetTitle className="sr-only">Drawing Canvas</SheetTitle>
          <div className="h-full flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">Draw</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDrawing(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 p-4">
              <DrawingCanvas />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Attachments Sheet */}
      <Sheet open={showAttachments} onOpenChange={setShowAttachments}>
        <SheetContent side="bottom" className="h-[50vh] w-screen p-0 max-w-none">
          <SheetTitle className="sr-only">Attachments</SheetTitle>
          <div className="h-full flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">Attachments</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAttachments(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <FileAttachments />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Voice Recorder Sheet */}
      <Sheet open={showVoiceRecorder} onOpenChange={setShowVoiceRecorder}>
        <SheetContent side="bottom" className="h-[40vh] w-screen p-0 max-w-none">
          <SheetTitle className="sr-only">Voice Recorder</SheetTitle>
          <div className="h-full flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">Voice Recording</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVoiceRecorder(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center">
              <VoiceRecorder />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
