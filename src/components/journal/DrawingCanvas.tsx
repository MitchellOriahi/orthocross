import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush, FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Eraser, Pencil, Trash2, Palette, MousePointer2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DrawingCanvasProps {
  onSave?: (dataUrl: string) => void;
  initialImageUrl?: string | null;
}

const BRUSH_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
];

export const DrawingCanvas = ({ onSave, initialImageUrl }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [tool, setTool] = useState<'draw' | 'erase' | 'select'>('draw');
  const [selectedColor, setSelectedColor] = useState(BRUSH_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!canvasRef.current) return;

    let canvas: FabricCanvas | null = null;
    let raf1 = 0;
    let raf2 = 0;

    const build = () => {
      const wrap = canvasWrapRef.current;
      if (!canvasRef.current || !wrap) return;

      // Size the canvas to the space actually available inside the sheet, so it
      // never exceeds the wrapper and gets clipped by overflow-hidden. Fall back
      // to sensible defaults if layout hasn't settled yet.
      const availWidth = wrap.clientWidth || (isMobile ? 320 : 640);
      const availHeight = wrap.clientHeight || (isMobile ? 400 : 600);
      const canvasWidth = Math.max(200, Math.min(availWidth - 16, 800));
      const canvasHeight = Math.max(200, availHeight - 16);

      canvas = new FabricCanvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: "#ffffff",
        isDrawingMode: true,
      });

      const brush = new PencilBrush(canvas);
      brush.color = selectedColor;
      brush.width = 2;
      canvas.freeDrawingBrush = brush;

      // Load initial image if provided
      if (initialImageUrl) {
        FabricImage.fromURL(initialImageUrl, { crossOrigin: 'anonymous' })
          .then((fabricImg) => {
            fabricImg.scaleToWidth(canvasWidth);
            canvas?.add(fabricImg);
            canvas?.renderAll();
          })
          .catch((error) => {
            console.error('Error loading image:', error);
          });
      }

      setFabricCanvas(canvas);
    };

    // Defer to after the sheet's open animation so the wrapper has its real size.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(build);
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      canvas?.dispose();
    };
  }, [isMobile, initialImageUrl]);

  useEffect(() => {
    if (!fabricCanvas) return;
    const brush = fabricCanvas.freeDrawingBrush as PencilBrush;
    fabricCanvas.isDrawingMode = tool !== 'select';
    fabricCanvas.selection = tool === 'select';
    if (brush) {
      // The canvas background is a fixed #ffffff and the export is a flat
      // PNG, so painting white is visually identical to erasing.
      brush.color = tool === 'erase' ? '#ffffff' : selectedColor;
      brush.width = tool === 'erase' ? 20 : 2;
    }
  }, [selectedColor, tool, fabricCanvas]);

  // In select mode, Delete/Backspace removes the picked strokes.
  useEffect(() => {
    if (!fabricCanvas) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const active = fabricCanvas.getActiveObjects();
      if (active.length === 0) return;
      e.preventDefault();
      active.forEach((obj) => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fabricCanvas]);

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
  };

  const handleSave = () => {
    if (!fabricCanvas || !onSave) return;
    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });
    onSave(dataUrl);
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-3 h-full min-h-0 min-w-0">
      <div className="flex flex-col gap-2 shrink-0 min-w-0">
        <div className="grid grid-cols-3 gap-2 pr-10">
        <Button
          variant={tool === 'draw' ? "default" : "outline"}
          className="h-11 min-w-0 px-2"
          aria-pressed={tool === 'draw'}
          onClick={() => setTool('draw')}
        >
          <Pencil className="h-5 w-5" />
          <span className="sr-only">Draw</span>
        </Button>
        <Button
          variant={tool === 'erase' ? "default" : "outline"}
          className="h-11 min-w-0 px-2"
          aria-pressed={tool === 'erase'}
          onClick={() => setTool('erase')}
        >
          <Eraser className="h-5 w-5" />
          <span className="sr-only">Erase</span>
        </Button>
        <Button
          variant={tool === 'select' ? "default" : "outline"}
          className="h-11 min-w-0 px-2"
          aria-pressed={tool === 'select'}
          onClick={() => setTool('select')}
        >
          <MousePointer2 className="h-5 w-5" />
          <span className="sr-only">Select</span>
        </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-11 shrink-0 px-3" aria-label="Pen colors" title="Pen colors">
              <Palette className="h-4 w-4 mr-2" />
              <span className={`w-4 h-4 rounded border border-border drawing-swatch-${BRUSH_COLORS.find(color => color.value === selectedColor)?.name.toLowerCase()}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" collisionPadding={16} className="w-56 max-w-[calc(100vw-2rem)] p-2 grid grid-cols-4 gap-2">
            {BRUSH_COLORS.map(color => (
              <Button key={color.value} variant="outline"
                className={`h-11 w-full p-1 ${selectedColor === color.value ? 'ring-2 ring-ring ring-offset-2 ring-offset-popover' : ''}`}
                title={color.name} aria-label={`Brush color ${color.name}`} aria-pressed={selectedColor === color.value}
                onClick={() => {
                  setSelectedColor(color.value);
                  setTool('draw');
                  if (fabricCanvas) {
                    fabricCanvas.isDrawingMode = true;
                    fabricCanvas.selection = false;
                    if (fabricCanvas.freeDrawingBrush) {
                      fabricCanvas.freeDrawingBrush.color = color.value;
                      fabricCanvas.freeDrawingBrush.width = 2;
                    }
                  }
                  setShowColorPicker(false);
                }}>
                <span className={`h-full w-full rounded-sm drawing-swatch-${color.name.toLowerCase()}`} />
              </Button>
            ))}
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={handleClear} aria-label="Clear" title="Clear">
          <Trash2 className="h-5 w-5" />
        </Button>
        {onSave && (
          <Button variant="default" className="h-11 min-w-0 flex-1 whitespace-normal" onClick={handleSave}>
            Save Drawing
          </Button>
        )}
        </div>
      </div>
      <div ref={canvasWrapRef} className="border border-border rounded-lg overflow-hidden flex-1 min-h-0 min-w-0 flex items-center justify-center bg-muted/20">
        <canvas ref={canvasRef} className="max-w-full max-h-full" />
      </div>
    </div>
  );
};
