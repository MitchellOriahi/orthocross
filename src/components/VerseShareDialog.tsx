import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { drawVerseTypography } from "@/components/verseImageTypography";
import { VERSE_ARTWORK_POOL, EXTRA_IMAGE_LIMIT, verseArtworkDay, restoreVerseArtwork, replaceVerseArtwork, type VerseImageStyle } from "@/components/verseImageStyles";
import { loadVerseBackground, preloadVerseBackgrounds } from "@/components/versePhotoBackgrounds";
import { downloadVerseImage, shareVerseImage } from "@/components/verseImageSharing";

interface VerseShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verseText: string;
  verseReference: string;
}

export const VerseShareDialog = ({ open, onOpenChange, verseText, verseReference }: VerseShareDialogProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [day, setDay] = useState(() => verseArtworkDay());
  const storageKey = `orthocross-verse-art:${day}:${verseReference}|${verseText}`;
  const restored = useMemo(() => {
    try { return restoreVerseArtwork(day, localStorage.getItem(storageKey)); }
    catch { return restoreVerseArtwork(day, null); }
  }, [day, storageKey]);
  const [saved, setSaved] = useState({ key: storageKey, session: restored });
  const session = saved.key === storageKey ? saved.session : restored;
  const styles = session.ids.map(id => VERSE_ARTWORK_POOL.find(style => style.id === id) ?? VERSE_ARTWORK_POOL[0]);
  const selectedArtwork = styles[selectedStyle] ?? styles[0];
  const images = useRef<Record<string, string>>({});
  const generation = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setDay(verseArtworkDay()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => { preloadVerseBackgrounds(); }, []);

  const generateImage = useCallback(async (style: VerseImageStyle, cacheKey: string) => {
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

      const img = await loadVerseBackground(style.id);
      const cropSize = Math.min(img.naturalWidth, img.naturalHeight);
      ctx.drawImage(img, (img.naturalWidth - cropSize) / 2, (img.naturalHeight - cropSize) / 2, cropSize, cropSize, 0, 0, size, size);
      drawVerseTypography(ctx, size, style.treatment, verseText, verseReference);

      if (generation.current !== requestId) return;
      const result = canvas.toDataURL("image/png");
      images.current[cacheKey] = result;
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
    if (!open) { generation.current++; setIsGenerating(false); return; }
    const cacheKey = `${storageKey}:${selectedArtwork.id}`;
    const cached = images.current[cacheKey];
    setImageUrl(cached ?? null);
    setGenerationError(null);
    if (cached) { generation.current++; setIsGenerating(false); }
    else void generateImage(selectedArtwork, cacheKey);
    return () => { generation.current++; };
  }, [generateImage, open, storageKey, selectedArtwork.id]);

  const selectStyle = (index: number) => {
    if (isGenerating || index === selectedStyle) return;
    setSelectedStyle(index);
  };

  const newImage = () => {
    if (isGenerating) return;
    const next = replaceVerseArtwork(day, session, selectedStyle);
    if (next === session) return;
    setSaved({ key: storageKey, session: next });
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* In-memory choices still work. */ }
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
            {styles.map((style, index) => (
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
              onClick={() => generationError ? void generateImage(selectedArtwork, `${storageKey}:${selectedArtwork.id}`) : newImage()}
              disabled={isGenerating || (!generationError && session.replacements >= EXTRA_IMAGE_LIMIT)}
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
