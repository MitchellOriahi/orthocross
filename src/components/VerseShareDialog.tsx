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

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const drawTextOverlay = (
    ctx: CanvasRenderingContext2D,
    size: number,
  ) => {
    // Bottom gradient band — keeps artwork visible on top, text legible below
    const bandTop = size * 0.5;
    const band = ctx.createLinearGradient(0, bandTop, 0, size);
    band.addColorStop(0, "rgba(8, 12, 24, 0)");
    band.addColorStop(0.45, "rgba(8, 12, 24, 0.65)");
    band.addColorStop(1, "rgba(8, 12, 24, 0.92)");
    ctx.fillStyle = band;
    ctx.fillRect(0, bandTop, size, size - bandTop);

    // Thin gold hairline frame
    ctx.strokeStyle = "hsl(42 70% 70% / 0.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, size - 56, size - 56);

    // Small cross ornament above the verse
    const crossY = size * 0.62;
    ctx.fillStyle = "hsl(42 80% 75%)";
    ctx.fillRect(size / 2 - 1.5, crossY - 14, 3, 28);
    ctx.fillRect(size / 2 - 9, crossY - 1.5, 18, 3);

    const quote = `“${verseText}”`;
    ctx.fillStyle = "hsl(40 30% 96%)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 16;

    ctx.font = "400 44px 'Cormorant Garamond', Georgia, 'Times New Roman', serif";
    const maxWidth = 880;
    let lines = wrapCanvasText(ctx, quote, maxWidth);
    if (lines.length > 6) {
      ctx.font = "400 38px 'Cormorant Garamond', Georgia, serif";
      lines = wrapCanvasText(ctx, quote, maxWidth);
    }
    const lineHeight = lines.length > 5 ? 50 : 58;
    const startY = crossY + 28;
    lines.forEach((line, index) => {
      ctx.fillText(line, size / 2, startY + index * lineHeight);
    });

    // Reference in gold tracked caps
    ctx.fillStyle = "hsl(42 78% 72%)";
    ctx.font = "500 22px 'Inter', system-ui, sans-serif";
    const refY = startY + lines.length * lineHeight + 24;
    const refText = verseReference.toUpperCase().split("").join(" ");
    ctx.fillText(refText, size / 2, refY);

    // Signature
    ctx.shadowBlur = 0;
    ctx.fillStyle = "hsl(0 0% 92% / 0.7)";
    ctx.font = "500 16px 'Inter', system-ui, sans-serif";
    ctx.fillText("O R T H O C R O S S", size / 2, size - 56);
  };

  const drawFallbackBackground = (ctx: CanvasRenderingContext2D, size: number) => {
    const bg = ctx.createLinearGradient(0, 0, size, size);
    bg.addColorStop(0, "hsl(220 40% 8%)");
    bg.addColorStop(0.6, "hsl(220 35% 14%)");
    bg.addColorStop(1, "hsl(38 48% 22%)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    const glow = ctx.createRadialGradient(size * 0.5, size * 0.7, 60, size * 0.5, size * 0.7, 700);
    glow.addColorStop(0, "hsl(42 72% 72% / 0.32)");
    glow.addColorStop(1, "hsl(42 64% 28% / 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  };

  const generateImage = useCallback(async () => {
    setIsGenerating(true);
    try {
      await document.fonts?.ready;
      const size = 1080;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable");

      let bgDrawn = false;
      try {
        const { data, error } = await supabase.functions.invoke("generate-verse-image", {
          body: { verseText, verseReference },
        });
        if (error) throw error;
        if (data?.imageUrl) {
          const img = await loadImage(data.imageUrl);
          ctx.drawImage(img, 0, 0, size, size);
          bgDrawn = true;
        }
      } catch (err) {
        console.warn("AI background failed, using fallback:", err);
      }

      if (!bgDrawn) drawFallbackBackground(ctx, size);
      drawTextOverlay(ctx, size);

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

          <div className="flex gap-2">
            <Button
              onClick={() => { setImageUrl(null); generateImage(); }}
              disabled={isGenerating}
              variant="secondary"
              className="flex-1 gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              New Image
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="default" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
