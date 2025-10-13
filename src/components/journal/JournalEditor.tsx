import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Highlighter, Pencil, Image as ImageIcon, Mic, X, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { DrawingCanvas } from "./DrawingCanvas";
import { FileAttachments } from "./FileAttachments";
import { VoiceRecorder } from "./VoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Attachment {
  type: 'drawing' | 'voice' | 'image';
  url: string;
  name: string;
  timestamp: string;
}

interface JournalEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  isSaving: boolean;
  noteId: string;
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
  noteId,
}: JournalEditorProps) => {
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showHighlighter, setShowHighlighter] = useState(false);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const isMobile = useIsMobile();

  // Load existing attachments
  useEffect(() => {
    if (!noteId || !user) return;
    
    const loadAttachments = async () => {
      const { data } = await supabase
        .from('journal_entries')
        .select('attachments')
        .eq('id', noteId)
        .single();
      
      if (data?.attachments) {
        setAttachments(data.attachments as unknown as Attachment[]);
      }
    };
    
    loadAttachments();
  }, [noteId, user]);

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

  const saveAttachmentsToDB = async (newAttachments: Attachment[]) => {
    if (!noteId || !user) return;
    
    await supabase
      .from('journal_entries')
      .update({ attachments: newAttachments as unknown as any })
      .eq('id', noteId);
  };

  const handleDrawingSave = async (dataUrl: string) => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Upload to storage
      const fileName = `${user.id}/${noteId}/drawing-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('journal-attachments')
        .upload(fileName, blob);
      
      if (uploadError) throw uploadError;
      
      // Get signed URL (valid for 1 year)
      const { data: signedUrlData } = await supabase.storage
        .from('journal-attachments')
        .createSignedUrl(fileName, 31536000);
      
      if (!signedUrlData) throw new Error('Failed to create signed URL');
      
      // Add to attachments
      const newAttachment: Attachment = {
        type: 'drawing',
        url: signedUrlData.signedUrl,
        name: `Drawing ${new Date().toLocaleString()}`,
        timestamp: new Date().toISOString()
      };
      
      const newAttachments = [...attachments, newAttachment];
      setAttachments(newAttachments);
      await saveAttachmentsToDB(newAttachments);
      
      toast.success("Drawing saved!");
      setShowDrawing(false);
    } catch (error) {
      console.error('Error saving drawing:', error);
      toast.error("Failed to save drawing");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob) => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      const fileName = `${user.id}/${noteId}/voice-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('journal-attachments')
        .upload(fileName, audioBlob);
      
      if (uploadError) throw uploadError;
      
      const { data: signedUrlData } = await supabase.storage
        .from('journal-attachments')
        .createSignedUrl(fileName, 31536000);
      
      if (!signedUrlData) throw new Error('Failed to create signed URL');
      
      const newAttachment: Attachment = {
        type: 'voice',
        url: signedUrlData.signedUrl,
        name: `Voice Note ${new Date().toLocaleString()}`,
        timestamp: new Date().toISOString()
      };
      
      const newAttachments = [...attachments, newAttachment];
      setAttachments(newAttachments);
      await saveAttachmentsToDB(newAttachments);
      
      toast.success("Voice note saved!");
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Error saving voice note:', error);
      toast.error("Failed to save voice note");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFilesUpload = async (files: File[]) => {
    if (!user || files.length === 0) return;
    
    setIsUploading(true);
    try {
      const newAttachments = [...attachments];
      
      for (const file of files) {
        const fileName = `${user.id}/${noteId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('journal-attachments')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: signedUrlData } = await supabase.storage
          .from('journal-attachments')
          .createSignedUrl(fileName, 31536000);
        
        if (!signedUrlData) throw new Error('Failed to create signed URL');
        
        newAttachments.push({
          type: 'image',
          url: signedUrlData.signedUrl,
          name: file.name,
          timestamp: new Date().toISOString()
        });
      }
      
      setAttachments(newAttachments);
      await saveAttachmentsToDB(newAttachments);
      
      toast.success(`${files.length} file(s) saved!`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (index: number) => {
    if (!user) return;
    
    try {
      const attachment = attachments[index];
      
      // Extract file path from URL
      const urlParts = attachment.url.split('/');
      const filePath = `${user.id}/${noteId}/${urlParts[urlParts.length - 1]}`;
      
      // Delete from storage
      await supabase.storage
        .from('journal-attachments')
        .remove([filePath]);
      
      // Remove from state and DB
      const newAttachments = attachments.filter((_, i) => i !== index);
      setAttachments(newAttachments);
      await saveAttachmentsToDB(newAttachments);
      
      toast.success("Attachment deleted");
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error("Failed to delete attachment");
    }
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

        {/* Attachments Display */}
        {attachments.length > 0 && (
          <div className="px-4 pb-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Attachments</h4>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="relative group">
                  {attachment.type === 'drawing' || attachment.type === 'image' ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={attachment.url} alt={attachment.name} className="w-full h-full object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                      <Mic className="h-4 w-4" />
                      <span className="text-xs truncate max-w-[100px]">{attachment.name}</span>
                      <audio src={attachment.url} controls className="h-6" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleDeleteAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(isSaving || isUploading) && (
          <div className="px-4 py-1 text-xs text-muted-foreground">
            {isUploading ? 'Uploading...' : 'Saving...'}
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
              <DrawingCanvas onSave={handleDrawingSave} />
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
              <FileAttachments onFilesChange={handleFilesUpload} />
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
              <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
