import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush } from "fabric";
import { Button } from "@/components/ui/button";
import { Eraser, Pencil, Trash2 } from "lucide-react";

interface DrawingCanvasProps {
  onSave?: (dataUrl: string) => void;
}

export const DrawingCanvas = ({ onSave }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      isDrawingMode: true,
    });

    // Configure the drawing brush
    const brush = new PencilBrush(canvas);
    brush.color = "#000000";
    brush.width = 2;
    canvas.freeDrawingBrush = brush;

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

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
    <div className="flex flex-col gap-4 h-full">
      <div className="flex gap-2 items-center">
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
