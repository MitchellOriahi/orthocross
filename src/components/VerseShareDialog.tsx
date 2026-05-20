import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, Mail, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VerseShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verseText: string;
  verseReference: string;
}

const wrapCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
};

export const VerseShareDialog = ({ open, onOpenChange, verseText, verseReference }: VerseShareDialogProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = useCallback(async () => {
    setIsGenerating(true);
    try {
      await document.fonts?.ready;

      const canvas = document.createElement("canvas");
      const size = 1080;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable");

      const background = ctx.createLinearGradient(0, 0, size, size);
      background.addColorStop(0, "hsl(0 0% 2%)");
      background.addColorStop(0.5, "hsl(0 0% 7%)");
      background.addColorStop(1, "hsl(38 48% 16%)");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size, size);

      const glow = ctx.createRadialGradient(size * 0.5, size * 0.42, 40, size * 0.5, size * 0.42, 560);
      glow.addColorStop(0, "hsl(42 72% 72% / 0.28)");
      glow.addColorStop(0.45, "hsl(42 64% 42% / 0.1)");
      glow.addColorStop(1, "hsl(42 64% 28% / 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = "hsl(42 70% 70% / 0.18)";
      ctx.lineWidth = 3;
      [92, 132, 888, 928].forEach((offset) => {
        ctx.strokeRect(offset, offset, size - offset * 2, size - offset * 2);
      });

      ctx.save();
      ctx.translate(size / 2, 190);
      ctx.strokeStyle = "hsl(42 74% 74% / 0.78)";
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, -54);
      ctx.lineTo(0, 78);
      ctx.moveTo(-42, -18);
      ctx.lineTo(42, -18);
      ctx.moveTo(-29, 24);
      ctx.lineTo(29, 24);
      ctx.stroke();
      ctx.restore();

      const quote = `“${verseText}”`;
      ctx.fillStyle = "hsl(0 0% 96%)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "500 58px Georgia, 'Times New Roman', serif";
      const maxWidth = 800;
      let lines = wrapCanvasText(ctx, quote, maxWidth);
      if (lines.length > 8) {
        ctx.font = "500 50px Georgia, 'Times New Roman', serif";
        lines = wrapCanvasText(ctx, quote, maxWidth);
      }
      const lineHeight = lines.length > 7 ? 68 : 76;
      const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, index) => {
        ctx.fillText(line, size / 2, startY + index * lineHeight);
      });

      ctx.fillStyle = "hsl(42 70% 76%)";
      ctx.font = "600 38px Inter, system-ui, sans-serif";
      ctx.fillText(`— ${verseReference}`, size / 2, Math.min(850, startY + lines.length * lineHeight + 70));

      ctx.fillStyle = "hsl(0 0% 88% / 0.78)";
      ctx.font = "500 30px Inter, system-ui, sans-serif";
      ctx.fillText("OrthoCross", size / 2, 970);

      setImageUrl(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error('Error generating verse image:', error);
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [verseReference, verseText]);

  useEffect(() => {
    if (open && !imageUrl && !isGenerating) {
      generateImage();
    }
  }, [generateImage, imageUrl, isGenerating, open]);

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
