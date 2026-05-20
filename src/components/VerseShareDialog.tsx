import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VerseShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verseText: string;
  verseReference: string;
}

export const VerseShareDialog = ({ open, onOpenChange, verseText, verseReference }: VerseShareDialogProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-verse-image', {
        body: { verseText, verseReference },
      });
      if (error) throw error;
      if (data?.imageUrl) setImageUrl(data.imageUrl);
    } catch (error) {
      console.error('Error generating verse image:', error);
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (open && !imageUrl && !isGenerating) {
      generateImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset when verse changes
  useEffect(() => {
    setImageUrl(null);
  }, [verseReference, verseText]);

  const filename = `orthocross-verse-${verseReference.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
  const shareText = `"${verseText}" — ${verseReference}\n\nShared from OrthoCross`;

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded!");
  };

  const handleShare = async (method: 'native' | 'email' | 'sms') => {
    if (!imageUrl) return;
    try {
      if (method === 'native' && navigator.share) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: 'image/png' });
        await navigator.share({
          title: 'Verse of the Day',
          text: shareText,
          files: [file],
        });
        toast.success("Shared successfully!");
      } else if (method === 'email') {
        window.location.href = `mailto:?subject=${encodeURIComponent('Verse of the Day')}&body=${encodeURIComponent(shareText)}`;
      } else if (method === 'sms') {
        window.location.href = `sms:?body=${encodeURIComponent(shareText)}`;
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Sharing failed. Try downloading the image instead.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Share Verse of the Day</DialogTitle>
          <DialogDescription>
            {verseReference}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg overflow-hidden aspect-square flex items-center justify-center">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Creating your shareable image...</p>
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt={`${verseReference} verse`} className="w-full h-full object-cover" />
            ) : (
              <p className="text-sm text-muted-foreground">Failed to load image</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Share this verse with friends and family
            </p>

            <div className="grid grid-cols-2 gap-2">
              {typeof navigator !== 'undefined' && (navigator as any).share && (
                <Button
                  onClick={() => handleShare('native')}
                  disabled={isGenerating || !imageUrl}
                  variant="outline"
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              )}

              <Button
                onClick={handleDownload}
                disabled={isGenerating || !imageUrl}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>

              <Button
                onClick={() => handleShare('email')}
                disabled={isGenerating || !imageUrl}
                variant="outline"
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>

              <Button
                onClick={() => handleShare('sms')}
                disabled={isGenerating || !imageUrl}
                variant="outline"
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Text
              </Button>
            </div>
          </div>

          <Button onClick={() => onOpenChange(false)} variant="default" className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
