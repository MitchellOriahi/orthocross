import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Highlighter, Pencil, Image as ImageIcon, Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { DrawingCanvas } from "./DrawingCanvas";
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
  const contentDivRef = useRef<HTMLDivElement>(null);
  const [showHighlighter, setShowHighlighter] = useState(false);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingDrawingUrl, setEditingDrawingUrl] = useState<string | null>(null);
  const [editingDrawingElement, setEditingDrawingElement] = useState<HTMLElement | null>(null);
  const isMobile = useIsMobile();

  const handleHighlight = () => {
    if (!contentDivRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowHighlighter(!showHighlighter);
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      setShowHighlighter(!showHighlighter);
      return;
    }

    const mark = document.createElement('mark');
    mark.className = selectedColor.class;
    range.surroundContents(mark);
    
    onContentChange(contentDivRef.current.innerHTML);
    setShowHighlighter(false);
    selection.removeAllRanges();
  };

  const insertIntoContent = (html: string) => {
    if (!contentDivRef.current) return;
    
    const currentContent = contentDivRef.current.innerHTML || content;
    const newContent = currentContent + html;
    
    contentDivRef.current.innerHTML = newContent;
    onContentChange(newContent);
    
    // Scroll to bottom and focus
    setTimeout(() => {
      if (contentDivRef.current) {
        contentDivRef.current.scrollTop = contentDivRef.current.scrollHeight;
        contentDivRef.current.focus();
      }
    }, 100);
  };

  const handleDeleteMedia = (element: HTMLElement) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    element.remove();
    if (contentDivRef.current) {
      onContentChange(contentDivRef.current.innerHTML);
      toast.success("Item deleted");
    }
  };

  const handlePinMedia = async (mediaUrl: string, mediaType: string) => {
    if (!user) return;
    
    try {
      await (supabase as any)
        .from('journal_entries')
        .update({ 
          pinned_media_url: mediaUrl,
          pinned_media_type: mediaType 
        })
        .eq('id', noteId);
      
      toast.success("Media pinned to dashboard!");
    } catch (error) {
      console.error('Error pinning media:', error);
      toast.error("Failed to pin media");
    }
  };

  const handleEditDrawing = (imgElement: HTMLImageElement) => {
    setEditingDrawingUrl(imgElement.src);
    setEditingDrawingElement(imgElement.parentElement as HTMLElement);
    setShowDrawing(true);
  };

  // Add click handlers to media elements for deletion
  useEffect(() => {
    if (!contentDivRef.current) return;

    const handleMediaClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked element is a media element
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'AUDIO') {
        const actionBtns = target.parentElement?.querySelector('.media-action-btns') as HTMLElement;
        if (actionBtns) {
          actionBtns.style.display = actionBtns.style.display === 'none' ? 'flex' : 'none';
        }
      }
      
      // Handle pin button click
      if (target.classList.contains('media-pin-btn') || target.closest('.media-pin-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const btn = target.classList.contains('media-pin-btn') ? target : target.closest('.media-pin-btn') as HTMLElement;
        const mediaElement = btn.parentElement?.previousElementSibling as HTMLElement;
        if (mediaElement) {
          let mediaUrl = '';
          let mediaType = '';
          if (mediaElement.tagName === 'IMG') {
            mediaUrl = (mediaElement as HTMLImageElement).src;
            mediaType = 'image';
          } else if (mediaElement.tagName === 'VIDEO') {
            mediaUrl = (mediaElement as HTMLVideoElement).src;
            mediaType = 'video';
          } else if (mediaElement.tagName === 'AUDIO') {
            mediaUrl = (mediaElement as HTMLAudioElement).src;
            mediaType = 'audio';
          }
          handlePinMedia(mediaUrl, mediaType);
        }
      }
      
      // Handle edit drawing button click
      if (target.classList.contains('media-edit-btn') || target.closest('.media-edit-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const btn = target.classList.contains('media-edit-btn') ? target : target.closest('.media-edit-btn') as HTMLElement;
        const imgElement = btn.parentElement?.previousElementSibling as HTMLImageElement;
        if (imgElement && imgElement.tagName === 'IMG') {
          handleEditDrawing(imgElement);
        }
      }
      
      // Handle delete button click
      if (target.classList.contains('media-delete-btn') || target.closest('.media-delete-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const btn = target.classList.contains('media-delete-btn') ? target : target.closest('.media-delete-btn') as HTMLElement;
        if (btn.parentElement?.parentElement) {
          handleDeleteMedia(btn.parentElement.parentElement);
        }
      }
    };

    const contentDiv = contentDivRef.current;
    contentDiv.addEventListener('click', handleMediaClick);

    return () => {
      contentDiv.removeEventListener('click', handleMediaClick);
    };
  }, [content]);

  const handleDrawingSave = async (dataUrl: string) => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const fileName = `${user.id}/${noteId}/drawing-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('journal-attachments')
        .upload(fileName, blob);
      
      if (uploadError) throw uploadError;
      
      const { data: signedUrlData } = await supabase.storage
        .from('journal-attachments')
        .createSignedUrl(fileName, 31536000);
      
      if (!signedUrlData) throw new Error('Failed to create signed URL');
      
      // If editing existing drawing, replace it
      if (editingDrawingElement) {
        const imgElement = editingDrawingElement.querySelector('img') as HTMLImageElement;
        if (imgElement) {
          imgElement.src = signedUrlData.signedUrl;
        }
        onContentChange(contentDivRef.current?.innerHTML || '');
        setEditingDrawingUrl(null);
        setEditingDrawingElement(null);
        toast.success("Drawing updated!");
      } else {
        // Insert new drawing with action buttons
        const imgHtml = `<div class="my-4 relative inline-block group"><img src="${signedUrlData.signedUrl}" alt="Drawing" class="max-w-full rounded-lg border border-border" /><div class="media-action-btns absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" style="display: none;"><button class="media-pin-btn bg-primary text-primary-foreground rounded-full p-1 hover:bg-primary/90"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg></button><button class="media-edit-btn bg-secondary text-secondary-foreground rounded-full p-1 hover:bg-secondary/90"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button><button class="media-delete-btn bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div></div>`;
        insertIntoContent(imgHtml);
        toast.success("Drawing inserted!");
      }
      
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
      
      // Insert audio into content with pin and delete buttons
      const audioHtml = `<div class="my-4 relative group"><div class="p-3 bg-muted rounded-lg"><audio src="${signedUrlData.signedUrl}" controls class="w-full"></audio></div><div class="media-action-btns absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" style="display: none;"><button class="media-pin-btn bg-primary text-primary-foreground rounded-full p-1 hover:bg-primary/90"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg></button><button class="media-delete-btn bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div></div>`;
      insertIntoContent(audioHtml);
      
      toast.success("Voice note inserted!");
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Error saving voice note:', error);
      toast.error("Failed to save voice note");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!user || !files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileName = `${user.id}/${noteId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('journal-attachments')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: signedUrlData } = await supabase.storage
          .from('journal-attachments')
          .createSignedUrl(fileName, 31536000);
        
        if (!signedUrlData) throw new Error('Failed to create signed URL');
        
        // Insert image or video into content with pin and delete buttons
        if (file.type.startsWith('image/')) {
          const imgHtml = `<div class="my-4 relative inline-block group"><img src="${signedUrlData.signedUrl}" alt="${file.name}" class="max-w-full rounded-lg border border-border" /><div class="media-action-btns absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" style="display: none;"><button class="media-pin-btn bg-primary text-primary-foreground rounded-full p-1 hover:bg-primary/90"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg></button><button class="media-delete-btn bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div></div>`;
          insertIntoContent(imgHtml);
        } else if (file.type.startsWith('video/')) {
          const videoHtml = `<div class="my-4 relative group"><video src="${signedUrlData.signedUrl}" controls class="max-w-full rounded-lg border border-border"></video><div class="media-action-btns absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" style="display: none;"><button class="media-pin-btn bg-primary text-primary-foreground rounded-full p-1 hover:bg-primary/90"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg></button><button class="media-delete-btn bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div></div>`;
          insertIntoContent(videoHtml);
        }
      }
      
      toast.success(`${files.length} file(s) inserted!`);
      setShowAttachments(false);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      e.target.value = '';
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

        <div className="flex-1 overflow-auto">
          <div className="p-4 min-h-full">
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

            <div
              ref={contentDivRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => onContentChange(e.currentTarget.innerHTML)}
              onBlur={(e) => onContentChange(e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: content }}
              className={`resize-none border-none bg-transparent px-0 focus:outline-none leading-relaxed prose dark:prose-invert max-w-none ${
                isMobile ? 'text-sm' : 'text-base'
              }`}
              style={{ minHeight: 'calc(100vh - 400px)' }}
              data-placeholder="Start writing..."
            />
          </div>
        </div>

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
      {showDrawing && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold">{editingDrawingUrl ? 'Edit Drawing' : 'Draw'}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowDrawing(false);
                setEditingDrawingUrl(null);
                setEditingDrawingElement(null);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 p-4 overflow-hidden">
            <DrawingCanvas onSave={handleDrawingSave} initialImageUrl={editingDrawingUrl} />
          </div>
        </div>
      )}

      {/* Image/Video Upload Sheet */}
      <Sheet open={showAttachments} onOpenChange={setShowAttachments}>
        <SheetContent side="bottom" className="h-[30vh] w-screen p-0 max-w-none" onInteractOutside={(e) => e.preventDefault()}>
          <SheetTitle className="sr-only">Insert Media</SheetTitle>
          <div className="h-full flex flex-col items-center justify-center p-4">
            <input
              type="file"
              id="media-upload"
              accept="image/*,video/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <label htmlFor="media-upload">
              <Button variant="default" size="lg" asChild>
                <span className="cursor-pointer">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Choose Images/Videos
                </span>
              </Button>
            </label>
          </div>
        </SheetContent>
      </Sheet>

      {/* Voice Recorder Sheet */}
      <Sheet open={showVoiceRecorder} onOpenChange={setShowVoiceRecorder}>
        <SheetContent side="bottom" className="h-[40vh] w-screen p-0 max-w-none" onInteractOutside={(e) => e.preventDefault()}>
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
