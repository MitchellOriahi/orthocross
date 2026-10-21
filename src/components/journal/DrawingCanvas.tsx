import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Canvas as FabricCanvas, PencilBrush, FabricImage, type FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Eraser, Pencil, Trash2, Palette, MousePointer2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { hasDrawingToSave, shouldAutoSaveDrawing } from "./drawingAutoSave";

export interface DrawingCanvasHandle {
  /** The drawing as a PNG data URL, or null when nothing was drawn. */
  capture: () => string | null;
  /** Hands the drawing to onSave. No-op when nothing was drawn. */
  save: () => void;
}

interface DrawingCanvasProps {

  onSave?: (dataUrl: string) => void;
  initialImageUrl?: string | null;
  /** Flushes the drawing when the canvas is torn down (no save button). */
  autoSaveOnUnmount?: boolean;
  forwardedRef?: Ref<DrawingCanvasHandle>;
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

/** Flattens the transparent drawing onto white paper as a PNG. */
const exportDrawing = (canvas: FabricCanvas) => {
  const src = canvas.toCanvasElement(1);
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d");
  if (!ctx) return canvas.toDataURL({ format: "png", quality: 1, multiplier: 1 });
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(src, 0, 0);
  return out.toDataURL("image/png");
};

const DrawingCanvasView = ({ onSave, initialImageUrl, autoSaveOnUnmount, forwardedRef }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [tool, setTool] = useState<'draw' | 'erase' | 'select'>('draw');
  const [selectedColor, setSelectedColor] = useState(BRUSH_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const isMobile = useIsMobile();
  // The drawing is flushed when the panel is exited, so remember whether
  // anything was actually changed: an untouched or cleared panel saves nothing.
  const dirtyRef = useRef(false);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;


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

      // The paper is transparent so the eraser can cut real holes in ink;
      // white is shown behind it and added back when the drawing is exported.
      canvas = new FabricCanvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        isDrawingMode: true,
      });
      canvas.lowerCanvasEl.style.background = "#ffffff";

      const brush = new PencilBrush(canvas);
      brush.color = selectedColor;
      brush.width = 2;
      canvas.freeDrawingBrush = brush;

      // A freshly built canvas starts clean; only real edits count as work.
      dirtyRef.current = false;
      const markDirty = () => {
        dirtyRef.current = true;
      };
      canvas.on("path:created", markDirty);
      canvas.on("object:modified", markDirty);
      canvas.on("object:removed", markDirty);


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
      // Panels without a save button hand their drawing over as they close.
      const leaving = canvas;
      if (
        autoSaveOnUnmount &&
        leaving &&
        shouldAutoSaveDrawing({
          canvas: leaving,
          onSave: onSaveRef.current,
          dirty: dirtyRef.current,
        })
      ) {
        dirtyRef.current = false;
        onSaveRef.current?.(
          exportDrawing(leaving),
        );
      }
      canvas?.dispose();
    };
  }, [isMobile, initialImageUrl, autoSaveOnUnmount]);


  useEffect(() => {
    if (!fabricCanvas) return;
    const brush = fabricCanvas.freeDrawingBrush as PencilBrush;
    fabricCanvas.isDrawingMode = tool !== 'select';
    fabricCanvas.selection = tool === 'select';
    if (brush) {
      // The live eraser preview is white; the finished stroke really cuts
      // away pixels (see the path:created handler below).
      brush.color = tool === 'erase' ? '#ffffff' : selectedColor;
      brush.width = tool === 'erase' ? 20 : 2;
    }
  }, [selectedColor, tool, fabricCanvas]);

  // True eraser: erase strokes remove pixels from what is underneath instead
  // of painting white, and can never be selected or moved like ink.
  useEffect(() => {
    if (!fabricCanvas) return;
    const onPath = (e: { path: FabricObject }) => {
      if (tool !== 'erase' || !e.path) return;
      e.path.set({
        globalCompositeOperation: 'destination-out',
        stroke: '#000000',
        selectable: false,
        evented: false,
        hoverCursor: 'default',
      });
      fabricCanvas.requestRenderAll();
    };
    fabricCanvas.on('path:created', onPath as never);
    return () => {
      fabricCanvas.off('path:created', onPath as never);
    };
  }, [fabricCanvas, tool]);

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
    fabricCanvas.backgroundColor = "";
    fabricCanvas.renderAll();
    dirtyRef.current = true;
  };

  // There is no save button: whoever hosts the panel pulls the drawing out as
  // the visitor exits, or the canvas hands it over when it is torn down.
  useImperativeHandle(
    forwardedRef,
    () => ({
      capture: () => {
        const canvas = fabricCanvas;
        if (!hasDrawingToSave({ canvas, dirty: dirtyRef.current })) return null;
        dirtyRef.current = false;
        return exportDrawing(canvas);
      },
      save: () => {
        const canvas = fabricCanvas;
        if (!shouldAutoSaveDrawing({ canvas, onSave, dirty: dirtyRef.current })) return;
        dirtyRef.current = false;
        onSave?.(exportDrawing(canvas));
      },
    }),
    [fabricCanvas, onSave],
  );


  return (
    <div ref={containerRef} className="flex flex-col gap-3 h-full min-h-0 min-w-0">
      <div className="flex flex-col gap-2 shrink-0 min-w-0">
        <div className="grid grid-cols-3 gap-2 pr-14">
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
        <div className="grid grid-cols-[auto_auto] items-center gap-2 min-w-0">
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
        </div>
      </div>
      <div ref={canvasWrapRef} className="border border-border rounded-lg overflow-hidden flex-1 min-h-0 min-w-0 flex items-center justify-center bg-muted/20">
        <canvas ref={canvasRef} className="max-w-full max-h-full" />
      </div>
    </div>
  );
};

export const DrawingCanvas = forwardRef<
  DrawingCanvasHandle,
  Omit<DrawingCanvasProps, "forwardedRef">
>((props, ref) => <DrawingCanvasView {...props} forwardedRef={ref} />);

