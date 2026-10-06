import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { VERSE_IMAGE_STYLES } from "@/components/verseImageStyles";
import { loadVerseBackground, preloadVerseBackgrounds } from "@/components/versePhotoBackgrounds";
import { downloadVerseImage, shareVerseImage } from "@/components/verseImageSharing";

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
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(0);
  const images = useRef<Record<number, string>>({});
  const generation = useRef(0);
  const startedVerse = useRef("");

  useEffect(() => { preloadVerseBackgrounds(); }, []);

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

    // Original three-bar Orthodox cross, matching the gold frame and lettering.
    const crossY = size * 0.62;
    ctx.save();
    ctx.translate(size / 2, crossY - 6);
    ctx.strokeStyle = "hsl(42 78% 72%)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(0, 32);
    // Title bar, main arms, and raised-left slanted footrest.
    ctx.moveTo(-9, -21);
    ctx.lineTo(9, -21);
    ctx.moveTo(-18, -6);
    ctx.lineTo(18, -6);
    ctx.moveTo(-11, 13);
    ctx.lineTo(11, 23);
    ctx.stroke();
    ctx.restore();

    const quote = `“${verseText}”`;
    ctx.fillStyle = "hsl(40 30% 96%)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 16;

    const maxWidth = size - 160;
    const startY = crossY + 44;
    let fontSize = 44;
    let lines: string[] = [];
    while (fontSize >= 20) {
      ctx.font = `400 ${fontSize}px 'Cormorant Garamond', Georgia, serif`;
      lines = wrapCanvasText(ctx, quote, maxWidth);
      if (lines.length * fontSize * 1.25 <= size - 150 - startY) break;
      fontSize -= 2;
    }
    const lineHeight = fontSize * 1.25;
    lines.forEach((line, index) => ctx.fillText(line, size / 2, startY + index * lineHeight));
    ctx.fillStyle = "hsl(42 78% 72%)";
    ctx.font = "500 22px system-ui, sans-serif";
    ctx.fillText(verseReference.toUpperCase(), size / 2, startY + lines.length * lineHeight + 20);

    // Signature
    ctx.shadowBlur = 0;
    ctx.fillStyle = "hsl(0 0% 92% / 0.7)";
    ctx.font = "500 16px 'Inter', system-ui, sans-serif";
    ctx.fillText("O R T H O C R O S S", size / 2, size - 56);
  };

  const generateImage = useCallback(async (styleIndex: number) => {
    const requestId = ++generation.current;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const size = 1080;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable");

      const style = VERSE_IMAGE_STYLES[styleIndex] ?? VERSE_IMAGE_STYLES[0];
      const img = await loadVerseBackground(style.id);
      const cropSize = Math.min(img.naturalWidth, img.naturalHeight);
      ctx.drawImage(img, (img.naturalWidth - cropSize) / 2, (img.naturalHeight - cropSize) / 2, cropSize, cropSize, 0, 0, size, size);
      drawTextOverlay(ctx, size);

      if (generation.current !== requestId) return;
      const result = canvas.toDataURL("image/png");
      images.current[styleIndex] = result;
      setImageUrl(result);
    } catch (error) {
      console.error('Error generating verse image:', error);
      if (generation.current !== requestId) return;
      const message = error instanceof Error ? error.message : "The image could not be created.";
      setGenerationError(message);
      toast.error(message);
    } finally {
      if (generation.current === requestId) setIsGenerating(false);
    }
  }, [verseReference, verseText]);

  useEffect(() => {
    const verseKey = `${verseReference}|${verseText}`;
    if (!open) { generation.current++; setIsGenerating(false); return; }
    if (startedVerse.current === verseKey && imageUrl) return;
    if (startedVerse.current === verseKey) { void generateImage(selectedStyle); return; }
    startedVerse.current = verseKey;
    images.current = {};
    setSelectedStyle(0);
    setImageUrl(null);
    void generateImage(0);
  }, [generateImage, open, verseReference, verseText]);

  const selectStyle = (index: number) => {
    if (isGenerating || index === selectedStyle) return;
    setSelectedStyle(index);
    const cached = images.current[index];
    setImageUrl(cached ?? null);
    if (!cached) void generateImage(index);
  };

  const filename = `orthocross-verse-${verseReference.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
  const handleDownload = () => {
    if (!imageUrl) return;
    downloadVerseImage(imageUrl, filename);
    toast.success("Image downloaded!");
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    try {
      const outcome = await shareVerseImage(imageUrl, filename);
      if (outcome === "downloaded") toast.info("Image downloaded. This browser cannot share image attachments directly.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("The image could not be shared. You can download it instead.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto">
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
              <p className="text-sm text-muted-foreground">{generationError ?? "No image available"}</p>
            )}
          </div>

          <div role="tablist" aria-label="Verse image styles" className="grid grid-cols-3 gap-2">
            {VERSE_IMAGE_STYLES.map((style, index) => (
              <Button
                key={style.id}
                role="tab"
                aria-selected={selectedStyle === index}
                variant="outline"
                disabled={isGenerating}
                onClick={() => selectStyle(index)}
                className="h-8 min-w-0 rounded-full px-1 text-[10px] sm:text-xs whitespace-nowrap data-[selected=true]:border-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                data-selected={selectedStyle === index}
              >
                {style.title}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleShare} disabled={isGenerating || !imageUrl} variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button onClick={handleDownload} disabled={isGenerating || !imageUrl} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => generationError ? void generateImage(selectedStyle) : selectStyle((selectedStyle + 1) % VERSE_IMAGE_STYLES.length)}
              disabled={isGenerating}
              variant="secondary"
              className="flex-1 gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {generationError ? "Retry" : "New Image"}
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
