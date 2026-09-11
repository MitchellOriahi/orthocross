import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, Mail, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { IOS_APP_STORE_URL } from "@/hooks/useAppRating";
import orthodoxCrossWhite from "@/assets/orthodox-cross-white-new.png";
import orthodoxCrossBlack from "@/assets/orthodox-cross-black-new.png";
import galileeSunset from "@/assets/verse-backgrounds/galilee-sunset.jpg";
import galileeDusk from "@/assets/verse-backgrounds/galilee-dusk.jpg";
import mountainSunrise from "@/assets/verse-backgrounds/mountain-sunrise.jpg";

interface VerseShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verseText: string;
  verseReference: string;
}

const W = 1080;
const H = 1350; // 4:5 — Instagram-feed friendly, crops cleanly to stories

const PHOTOS = [galileeSunset, galileeDusk, mountainSunrise];

const STYLES = [
  { id: 'golden-hour', name: 'Golden Hour' },
  { id: 'pilgrim', name: "Pilgrim's Path" },
  { id: 'midnight', name: 'Midnight Gold' },
  { id: 'parchment', name: 'Parchment' },
] as const;

type StyleId = typeof STYLES[number]['id'];

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const wrapText = (ctx: CanvasRenderingContext2D, text: string, font: string, maxWidth: number) => {
  ctx.font = font;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
};

// Split the verse for mixed typography: opening / emphasized middle / closing.
const splitVerse = (text: string) => {
  const words = text.replace(/[“”"]/g, '').split(/\s+/).filter(Boolean);
  const a = Math.max(1, Math.round(words.length * 0.35));
  const b = Math.max(1, Math.round(words.length * 0.3));
  return {
    opening: words.slice(0, a).join(' '),
    middle: words.slice(a, a + b).join(' '),
    closing: words.slice(a + b).join(' '),
    words,
  };
};

interface Block {
  kind: 'caps' | 'script' | 'bold' | 'ref' | 'rule';
  text?: string;
  size: number;
}

// Measure, scale-to-fit, and draw a centered typographic stack.
const drawStack = (
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  opts: {
    centerY: number; maxHeight: number; maxWidth: number;
    capsColor: string; scriptColor: string; boldColor: string; refColor: string; ruleColor: string;
    shadow?: string; capsFont?: string; boldFont?: string;
  }
) => {
  const capsFamily = opts.capsFont ?? "'Inter', system-ui, sans-serif";
  const boldFamily = opts.boldFont ?? "'Inter', system-ui, sans-serif";
  const fontFor = (b: Block, scale: number) => {
    const s = Math.round(b.size * scale);
    if (b.kind === 'script') return `600 ${s}px 'Dancing Script', cursive`;
    if (b.kind === 'bold') return `800 ${s}px ${boldFamily}`;
    if (b.kind === 'ref') return `600 ${s}px 'Inter', system-ui, sans-serif`;
    return `600 ${s}px ${capsFamily}`;
  };
  const lineHeight = (b: Block, scale: number) =>
    Math.round(b.size * scale * (b.kind === 'script' ? 1.15 : b.kind === 'bold' ? 1.05 : 1.45));

  const layout = (scale: number) => {
    const rows: { block: Block; line: string; lh: number; font: string }[] = [];
    for (const b of blocks) {
      if (b.kind === 'rule') {
        rows.push({ block: b, line: '', lh: Math.round(28 * scale), font: '' });
        continue;
      }
      const text = b.kind === 'caps' || b.kind === 'ref' ? (b.text ?? '').toUpperCase() : (b.text ?? '');
      const font = fontFor(b, scale);
      const lines = wrapText(ctx, text, font, opts.maxWidth);
      for (const line of lines) rows.push({ block: b, line, lh: lineHeight(b, scale), font });
    }
    return rows;
  };

  let scale = 1;
  let rows = layout(scale);
  let total = rows.reduce((s, r) => s + r.lh, 0);
  while (total > opts.maxHeight && scale > 0.45) {
    scale -= 0.05;
    rows = layout(scale);
    total = rows.reduce((s, r) => s + r.lh, 0);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = opts.centerY - total / 2;
  for (const r of rows) {
    y += r.lh;
    if (r.block.kind === 'rule') {
      ctx.fillStyle = opts.ruleColor;
      ctx.fillRect(W / 2 - 36, y - r.lh / 2, 72, 5);
      continue;
    }
    if (opts.shadow) {
      ctx.shadowColor = opts.shadow;
      ctx.shadowBlur = 14;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.font = r.font;
    ctx.fillStyle =
      r.block.kind === 'script' ? opts.scriptColor :
      r.block.kind === 'bold' ? opts.boldColor :
      r.block.kind === 'ref' ? opts.refColor : opts.capsColor;
    const text = r.block.kind === 'ref' ? r.line.split('').join(' ') : r.line;
    ctx.fillText(text, W / 2, y - r.lh * 0.22);
  }
  ctx.shadowBlur = 0;
  return { top: opts.centerY - total / 2, bottom: opts.centerY + total / 2 };
};

const drawLogo = async (ctx: CanvasRenderingContext2D, y: number, dark: boolean) => {
  try {
    const cross = await loadImage(dark ? orthodoxCrossBlack : orthodoxCrossWhite);
    const h = 66;
    const w = (cross.width / cross.height) * h;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(cross, W / 2 - w / 2, y, w, h);
    ctx.globalAlpha = 1;
  } catch { /* wordmark still identifies the app */ }
  ctx.font = "600 24px 'Inter', system-ui, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = dark ? 'rgba(40,32,20,0.75)' : 'rgba(255,252,244,0.85)';
  ctx.fillText('O R T H O C R O S S', W / 2, y + 106);
};

// Large, faint three-bar cross watermark behind the text
const drawCrossWatermark = (ctx: CanvasRenderingContext2D, color: string, alpha: number) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const cx = W / 2, top = H * 0.16, h = H * 0.5, bw = 26;
  ctx.fillRect(cx - bw / 2, top, bw, h);
  ctx.fillRect(cx - 130, top + h * 0.18, 260, bw); // main bar
  ctx.fillRect(cx - 80, top + h * 0.07, 160, bw * 0.8); // upper bar
  ctx.save(); // slanted foot bar — raised left, as on the OrthoCross logo
  ctx.translate(cx, top + h * 0.78);
  ctx.rotate(0.32);
  ctx.fillRect(-95, -bw * 0.4, 190, bw * 0.8);
  ctx.restore();
  ctx.restore();
};

export const VerseShareDialog = ({ open, onOpenChange, verseText, verseReference }: VerseShareDialogProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [styleId, setStyleId] = useState<StyleId>('golden-hour');
  const [seed, setSeed] = useState(0);

  const generateImage = useCallback(async () => {
    setIsGenerating(true);
    try {
      await document.fonts.load("600 40px 'Dancing Script'");
      await document.fonts.load("800 40px 'Inter'");
      await document.fonts.ready;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is unavailable');

      const { opening, middle, closing, words } = splitVerse(verseText);
      const refBlock: Block = { kind: 'ref', text: verseReference, size: 26 };

      if (styleId === 'golden-hour') {
        const photo = await loadImage(PHOTOS[(verseReference.length + seed) % PHOTOS.length]);
        // cover-crop
        const scale = Math.max(W / photo.width, H / photo.height);
        const dw = photo.width * scale, dh = photo.height * scale;
        ctx.drawImage(photo, (W - dw) / 2, (H - dh) / 2, dw, dh);
        // legibility scrims
        let g = ctx.createLinearGradient(0, H * 0.35, 0, H);
        g.addColorStop(0, 'rgba(10,13,18,0)');
        g.addColorStop(0.55, 'rgba(10,13,18,0.45)');
        g.addColorStop(1, 'rgba(10,13,18,0.82)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        drawStack(ctx, [
          { kind: 'caps', text: opening, size: 34 },
          { kind: 'script', text: middle, size: 110 },
          { kind: 'caps', text: closing, size: 34 },
          { kind: 'rule', size: 0 },
          refBlock,
        ], {
          centerY: H * 0.66, maxHeight: 620, maxWidth: 860,
          capsColor: '#F3F0E9', scriptColor: '#FFFFFF', boldColor: '#FFFFFF',
          refColor: '#EBD9A4', ruleColor: 'rgba(235,217,164,0.0)',
          shadow: 'rgba(0,0,0,0.55)',
        });
        await drawLogo(ctx, H - 158, false);
      }

      if (styleId === 'pilgrim') {
        const cream = '#F6F0E2', navy = '#2E4057', navyDeep = '#243349', orange = '#C4622D', sand = '#E9DFC6';
        ctx.fillStyle = cream;
        ctx.fillRect(0, 0, W, H);
        // sun
        ctx.fillStyle = orange;
        ctx.beginPath(); ctx.arc(W * 0.74, H * 0.115, 96, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(246,240,226,0.25)';
        for (let i = 0; i < 260; i++) {
          const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 96;
          ctx.fillRect(W * 0.74 + Math.cos(a) * r, H * 0.115 + Math.sin(a) * r, 2.4, 2.4);
        }
        // clouds
        ctx.fillStyle = '#EFE8D6';
        for (const [cx, cy, s] of [[W * 0.16, H * 0.09, 1], [W * 0.88, H * 0.2, 0.7]] as const) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, 84 * s, 26 * s, 0, 0, Math.PI * 2);
          ctx.ellipse(cx + 48 * s, cy - 12 * s, 52 * s, 22 * s, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // hills
        const hill = (color: string, baseY: number, bulge: number, xShift: number) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(0, H);
          ctx.lineTo(0, baseY + bulge * 0.4);
          ctx.bezierCurveTo(W * 0.25 + xShift, baseY - bulge, W * 0.6 + xShift, baseY + bulge, W, baseY - bulge * 0.3);
          ctx.lineTo(W, H);
          ctx.closePath();
          ctx.fill();
        };
        hill('#8A9BB4', H * 0.62, 60, -60);         // distant haze hill
        hill(orange, H * 0.70, 90, 140);            // orange hill
        hill(navy, H * 0.78, 80, -120);             // navy hill
        hill(navyDeep, H * 0.90, 60, 60);           // foreground
        // winding path
        ctx.strokeStyle = sand;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(W * 0.46, H + 10);
        ctx.bezierCurveTo(W * 0.2, H * 0.93, W * 0.75, H * 0.85, W * 0.52, H * 0.76);
        ctx.bezierCurveTo(W * 0.4, H * 0.72, W * 0.6, H * 0.68, W * 0.64, H * 0.645);
        ctx.lineWidth = 60;
        ctx.stroke();
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.moveTo(W * 0.52, H * 0.76);
        ctx.bezierCurveTo(W * 0.44, H * 0.72, W * 0.6, H * 0.69, W * 0.645, H * 0.647);
        ctx.stroke();
        // hilltop chapel
        const vx = W * 0.66, vy = H * 0.615;
        ctx.fillStyle = sand;
        ctx.fillRect(vx - 46, vy + 8, 30, 26);
        ctx.fillRect(vx + 14, vy + 10, 26, 24);
        ctx.fillRect(vx - 10, vy - 12, 22, 46); // tower
        ctx.beginPath(); ctx.moveTo(vx - 12, vy - 12); ctx.lineTo(vx + 1, vy - 30); ctx.lineTo(vx + 14, vy - 12); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = sand; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(vx + 1, vy - 32); ctx.lineTo(vx + 1, vy - 46); ctx.moveTo(vx - 6, vy - 40); ctx.lineTo(vx + 8, vy - 40); ctx.stroke();
        // halftone texture on hills
        ctx.fillStyle = 'rgba(246,240,226,0.16)';
        for (let i = 0; i < 500; i++) {
          const x = Math.random() * W, y = H * 0.62 + Math.random() * H * 0.38;
          ctx.fillRect(x, y, 2.2, 2.2);
        }
        // corner sprigs
        ctx.strokeStyle = sand; ctx.fillStyle = sand; ctx.lineWidth = 3;
        for (const [bx, dir] of [[70, 1], [W - 70, -1]] as const) {
          ctx.beginPath(); ctx.moveTo(bx, H - 40); ctx.quadraticCurveTo(bx + 20 * dir, H - 110, bx + 8 * dir, H - 170); ctx.stroke();
          for (let i = 0; i < 5; i++) {
            const t = 0.3 + i * 0.15;
            const lx = bx + 14 * dir * t, ly = H - 40 - 130 * t;
            ctx.beginPath(); ctx.ellipse(lx + 14 * dir, ly, 13, 5.5, dir * (0.7 - i * 0.1), 0, Math.PI * 2); ctx.fill();
          }
        }
        // typography — caps / BOLD word / rule / caps / script ending
        const longest = [...words].sort((a, b) => b.replace(/\W/g, '').length - a.replace(/\W/g, '').length)[0];
        const li = words.indexOf(longest);
        const before = words.slice(0, li).join(' ');
        const scriptTail = words.slice(-2).join(' ');
        const after = words.slice(li + 1, Math.max(li + 1, words.length - 2)).join(' ');
        const blocks: Block[] = [
          ...(before ? [{ kind: 'caps', text: before, size: 40 } as Block] : []),
          { kind: 'bold', text: longest.replace(/[.,;:]$/, '').toUpperCase(), size: 92 },
          { kind: 'rule', size: 0 },
          ...(after ? [{ kind: 'caps', text: after, size: 40 } as Block] : []),
          { kind: 'script', text: scriptTail, size: 96 },
          refBlock,
        ];
        drawStack(ctx, blocks, {
          centerY: H * 0.335, maxHeight: 560, maxWidth: 800,
          capsColor: navy, scriptColor: orange, boldColor: navy,
          refColor: orange, ruleColor: orange,
        });
        await drawLogo(ctx, H - 148, false);
      }

      if (styleId === 'midnight') {
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, 'hsl(220 40% 8%)');
        bg.addColorStop(0.6, 'hsl(220 35% 14%)');
        bg.addColorStop(1, 'hsl(38 48% 22%)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        const glow = ctx.createRadialGradient(W * 0.5, H * 0.45, 60, W * 0.5, H * 0.45, 820);
        glow.addColorStop(0, 'hsl(42 72% 72% / 0.30)');
        glow.addColorStop(1, 'hsl(42 64% 28% / 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
        drawCrossWatermark(ctx, 'hsl(42 80% 75%)', 0.10);
        ctx.strokeStyle = 'hsl(42 70% 70% / 0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(34, 34, W - 68, H - 68);
        drawStack(ctx, [
          { kind: 'caps', text: opening, size: 36 },
          { kind: 'script', text: middle, size: 108 },
          { kind: 'caps', text: closing, size: 36 },
          { kind: 'rule', size: 0 },
          refBlock,
        ], {
          centerY: H * 0.47, maxHeight: 660, maxWidth: 840,
          capsColor: 'hsl(40 30% 96%)', scriptColor: 'hsl(45 85% 80%)', boldColor: '#fff',
          refColor: 'hsl(42 78% 72%)', ruleColor: 'hsl(42 78% 72% / 0.7)',
          shadow: 'rgba(0,0,0,0.8)',
        });
        await drawLogo(ctx, H - 168, false);
      }

      if (styleId === 'parchment') {
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, 'hsl(42 45% 92%)');
        bg.addColorStop(0.55, 'hsl(40 42% 88%)');
        bg.addColorStop(1, 'hsl(36 38% 82%)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        const vign = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.72);
        vign.addColorStop(0, 'hsl(35 30% 60% / 0)');
        vign.addColorStop(1, 'hsl(32 35% 45% / 0.3)');
        ctx.fillStyle = vign;
        ctx.fillRect(0, 0, W, H);
        drawCrossWatermark(ctx, 'hsl(0 55% 34%)', 0.07);
        ctx.strokeStyle = 'hsl(35 45% 45% / 0.55)';
        ctx.lineWidth = 2;
        ctx.strokeRect(34, 34, W - 68, H - 68);
        ctx.strokeRect(46, 46, W - 92, H - 92);
        drawStack(ctx, [
          { kind: 'caps', text: opening, size: 36 },
          { kind: 'script', text: middle, size: 106 },
          { kind: 'caps', text: closing, size: 36 },
          { kind: 'rule', size: 0 },
          refBlock,
        ], {
          centerY: H * 0.47, maxHeight: 660, maxWidth: 820,
          capsColor: 'hsl(30 25% 18%)', scriptColor: 'hsl(0 55% 34%)', boldColor: 'hsl(30 25% 16%)',
          refColor: 'hsl(0 55% 34%)', ruleColor: 'hsl(0 55% 34% / 0.7)',
        });
        await drawLogo(ctx, H - 168, true);
      }

      setImageUrl(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error('Error generating verse image:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [verseReference, verseText, styleId, seed]);

  useEffect(() => {
    if (open && !imageUrl && !isGenerating) {
      generateImage();
    }
  }, [generateImage, imageUrl, isGenerating, open]);

  // Reset when verse or style changes
  useEffect(() => {
    setImageUrl(null);
  }, [verseReference, verseText, styleId, seed]);

  const filename = `orthocross-verse-${verseReference.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
  // The image already carries the verse — the message only signs and links
  const shareText = `Shared from OrthoCross ☦\n${IOS_APP_STORE_URL}`;

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
      <DialogContent className="max-w-none w-screen h-[100dvh] rounded-none overflow-y-auto safe-top safe-bottom sm:max-w-md sm:w-full sm:h-auto sm:max-h-[92dvh] sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Share Verse of the Day</DialogTitle>
          <DialogDescription>
            {verseReference}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg overflow-hidden aspect-[4/5] flex items-center justify-center">
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

          <div className="flex justify-center gap-2 flex-wrap">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyleId(s.id)}
                disabled={isGenerating}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  s.id === styleId
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {s.name}
              </button>
            ))}
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
              onClick={() => setSeed(s => s + 1)}
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
