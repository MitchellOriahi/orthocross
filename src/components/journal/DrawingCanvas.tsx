import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Canvas as FabricCanvas, PencilBrush, FabricImage, type FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Eraser, Pencil, Trash2, Palette, MousePointer2, Undo2 } from "lucide-react";
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
  // Export at the screen's pixel density so the saved drawing is as sharp
  // outside the drawing board as it was inside it.
  const m = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const src = canvas.toCanvasElement(m);
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d");
  if (!ctx) return canvas.toDataURL({ format: "png", quality: 1, multiplier: m });
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
            // Anchor at the top-left corner (Fabric centers objects by default).
            fabricImg.set({ originX: 'left', originY: 'top', left: 0, top: 0 });
            fabricImg.scaleToWidth(canvasWidth);
            fabricImg.setCoords();
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


  const prevToolRef = useRef(tool);

  useEffect(() => {
    if (!fabricCanvas) return;
    const brush = fabricCanvas.freeDrawingBrush as PencilBrush;
    fabricCanvas.isDrawingMode = tool !== 'select';
    fabricCanvas.selection = tool === 'select';
    if (prevToolRef.current !== tool) {
      prevToolRef.current = tool;
      // Switching tools must not leave the previous tool's selection outline
      // (the grabber's blue bounding box) sitting on the board.
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
    }
    if (brush) {
      // The live eraser preview is white; the finished stroke really cuts
      // away pixels (see the path:created handler below).
      brush.color = tool === 'erase' ? '#ffffff' : selectedColor;
      brush.width = tool === 'erase' ? 20 : 2;
    }
  }, [selectedColor, tool, fabricCanvas]);

  // Undo history: each entry is the list of objects plus their positions.
  type Snapshot = { obj: FabricObject; props: Record<string, unknown> }[];
  const historyRef = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const toolRef = useRef(tool);
  toolRef.current = tool;

  const snapshot = (canvas: FabricCanvas): Snapshot =>
    canvas.getObjects().map((obj) => ({
      obj,
      props: {
        left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY,
        angle: obj.angle, flipX: obj.flipX, flipY: obj.flipY, skewX: obj.skewX, skewY: obj.skewY,
      },
    }));

  const record = (canvas: FabricCanvas) => {
    historyRef.current.push(snapshot(canvas));
    if (historyRef.current.length > 60) historyRef.current.shift();
    setCanUndo(historyRef.current.length > 1);
  };

  useEffect(() => {
    if (!fabricCanvas) return;
    historyRef.current = [snapshot(fabricCanvas)];
    setCanUndo(false);
    // The opened drawing becomes the starting point once it has loaded.
    const onAdded = (e: { target: FabricObject }) => {
      if (!(e.target instanceof FabricImage)) return;
      if (historyRef.current.length === 1 && historyRef.current[0].length === 0) {
        historyRef.current = [snapshot(fabricCanvas)];
      }
    };
    fabricCanvas.on('object:added', onAdded as never);
    const onModified = () => record(fabricCanvas);
    fabricCanvas.on('object:modified', onModified);
    return () => {
      fabricCanvas.off('object:added', onAdded as never);
      fabricCanvas.off('object:modified', onModified);
    };
  }, [fabricCanvas]);

  // True eraser: each erase stroke is cut out of every mark it touches. The
  // mark is redrawn without the erased pixels; fully erased marks are deleted,
  // so nothing invisible is left behind to select.
  useEffect(() => {
    if (!fabricCanvas) return;
    const onPath = (e: { path: FabricObject }) => {
      const eraser = e.path;
      if (!eraser) return;
      if (toolRef.current !== 'erase') {
        record(fabricCanvas);
        return;
      }
      fabricCanvas.remove(eraser);
      eraser.set({ globalCompositeOperation: 'destination-out', stroke: '#000000' });
      const er = eraser.getBoundingRect();
      const m = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      const objects = fabricCanvas.getObjects();
      objects.forEach((obj) => {
        const r = obj.getBoundingRect();
        if (r.left > er.left + er.width || r.left + r.width < er.left ||
            r.top > er.top + er.height || r.top + r.height < er.top) return;
        const pad = 2;
        const left = Math.floor(r.left) - pad;
        const top = Math.floor(r.top) - pad;
        const w = Math.ceil(r.width) + pad * 2;
        const h = Math.ceil(r.height) + pad * 2;
        const off = document.createElement('canvas');
        off.width = Math.max(1, Math.ceil(w * m));
        off.height = Math.max(1, Math.ceil(h * m));
        const ctx = off.getContext('2d');
        if (!ctx) return;
        ctx.scale(m, m);
        ctx.translate(-left, -top);
        obj.render(ctx);
        eraser.render(ctx);
        // Trim to what is still visible.
        const data = ctx.getImageData(0, 0, off.width, off.height).data;
        let minX = off.width, minY = off.height, maxX = -1, maxY = -1;
        for (let y = 0; y < off.height; y++) {
          for (let x = 0; x < off.width; x++) {
            if (data[(y * off.width + x) * 4 + 3] > 8) {
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
          }
        }
        const index = fabricCanvas.getObjects().indexOf(obj);
        fabricCanvas.remove(obj);
        if (maxX < 0) return;
        const tw = maxX - minX + 1;
        const th = maxY - minY + 1;
        const trimmed = document.createElement('canvas');
        trimmed.width = tw;
        trimmed.height = th;
        trimmed.getContext('2d')?.drawImage(off, minX, minY, tw, th, 0, 0, tw, th);
        const img = new FabricImage(trimmed, {
          left: left + minX / m,
          top: top + minY / m,
          originX: 'left',
          originY: 'top',
          scaleX: 1 / m,
          scaleY: 1 / m,
        });
        fabricCanvas.insertAt(Math.max(0, index), img);
      });
      dirtyRef.current = true;
      fabricCanvas.requestRenderAll();
      record(fabricCanvas);
    };
    fabricCanvas.on('path:created', onPath as never);
    return () => {
      fabricCanvas.off('path:created', onPath as never);
    };
  }, [fabricCanvas]);

  const handleUndo = () => {
    if (!fabricCanvas || historyRef.current.length < 2) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    fabricCanvas.discardActiveObject();
    fabricCanvas.remove(...fabricCanvas.getObjects());
    prev.forEach(({ obj, props }) => {
      obj.set(props);
      obj.setCoords();
    });
    if (prev.length) fabricCanvas.add(...prev.map((s) => s.obj));
    fabricCanvas.requestRenderAll();
    dirtyRef.current = true;
    setCanUndo(historyRef.current.length > 1);
  };

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
      record(fabricCanvas);
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
    record(fabricCanvas);
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
        <div className="grid grid-cols-3 gap-2 pr-14 min-w-0">
        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-11 w-full min-w-0 px-2" aria-label="Pen colors" title="Pen colors">
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
        <Button variant="outline" className="h-11 w-full min-w-0 px-2" onClick={handleUndo} disabled={!canUndo} aria-label="Undo" title="Undo">
          <Undo2 className="h-5 w-5" />
        </Button>
        <Button variant="outline" className="h-11 w-full min-w-0 px-2" onClick={handleClear} aria-label="Clear" title="Clear">
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

