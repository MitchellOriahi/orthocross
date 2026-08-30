import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush, FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Eraser, Pencil, Trash2, Palette } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
    <div ref={containerRef} className="flex flex-col gap-4 h-full">
      <div className="flex gap-2 items-center flex-wrap">
        <Button
          variant={tool === 'draw' ? "default" : "outline"}
          className="min-h-[44px]"
          aria-pressed={tool === 'draw'}
          onClick={() => setTool('draw')}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Draw
        </Button>
        <Button
          variant={tool === 'erase' ? "default" : "outline"}
          className="min-h-[44px]"
          aria-pressed={tool === 'erase'}
          onClick={() => setTool('erase')}
        >
          <Eraser className="h-4 w-4 mr-2" />
          Erase
        </Button>
        <Button
          variant={tool === 'select' ? "default" : "outline"}
          className="min-h-[44px]"
          aria-pressed={tool === 'select'}
          onClick={() => setTool('select')}
        >
          Select
        </Button>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
          >
            <Palette className="h-4 w-4 mr-2" />
            <div
              className="w-4 h-4 rounded border border-border"
              style={{ backgroundColor: selectedColor }}
            />
          </Button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-10 flex gap-1 flex-wrap max-w-[200px]">
              {BRUSH_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    setSelectedColor(color.value);
                    setShowColorPicker(false);
                  }}
                  className="w-11 h-11 rounded border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color.value,
                    borderColor: selectedColor === color.value ? "#000" : "transparent",
                  }}
                  title={color.name}
                  aria-label={`Brush color ${color.name}`}
                />
              ))}
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
        {onSave && (
          <Button variant="default" size="sm" onClick={handleSave}>
            Save Drawing
          </Button>
        )}
      </div>
      <div ref={canvasWrapRef} className="border border-border rounded-lg overflow-hidden flex-1 flex items-center justify-center bg-muted/20">
        <canvas ref={canvasRef} className="max-w-full max-h-full" />
      </div>
    </div>
  );
};
