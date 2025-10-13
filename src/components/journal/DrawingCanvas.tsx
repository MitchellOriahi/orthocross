import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush } from "fabric";
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
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(true);
  const [selectedColor, setSelectedColor] = useState(BRUSH_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const canvasWidth = Math.min(containerWidth - 32, 800);
      const canvasHeight = isMobile ? 400 : 600;

      const canvas = new FabricCanvas(canvasRef.current, {
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
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const fabricImg = new (window as any).fabric.Image(img);
          fabricImg.scaleToWidth(canvasWidth);
          canvas.add(fabricImg);
          canvas.renderAll();
        };
        img.src = initialImageUrl;
      }

      setFabricCanvas(canvas);

      return canvas;
    };

    const canvas = updateCanvasSize();

    return () => {
      canvas?.dispose();
    };
  }, [isMobile, initialImageUrl]);

  useEffect(() => {
    if (!fabricCanvas) return;
    const brush = fabricCanvas.freeDrawingBrush as PencilBrush;
    if (brush) {
      brush.color = selectedColor;
    }
  }, [selectedColor, fabricCanvas]);

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

  const toggleDrawingMode = () => {
    if (!fabricCanvas) return;
    fabricCanvas.isDrawingMode = !fabricCanvas.isDrawingMode;
    setIsDrawing(fabricCanvas.isDrawingMode);
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-4 h-full">
      <div className="flex gap-2 items-center flex-wrap">
        <Button
          variant={isDrawing ? "default" : "outline"}
          size="sm"
          onClick={toggleDrawingMode}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Draw
        </Button>
        <Button
          variant={!isDrawing ? "default" : "outline"}
          size="sm"
          onClick={toggleDrawingMode}
        >
          <Eraser className="h-4 w-4 mr-2" />
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
                  className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color.value,
                    borderColor: selectedColor === color.value ? "#000" : "transparent",
                  }}
                  title={color.name}
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
      <div className="border border-border rounded-lg overflow-hidden flex-1 flex items-center justify-center bg-muted/20">
        <canvas ref={canvasRef} className="max-w-full max-h-full" />
      </div>
    </div>
  );
};
