import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { CROP_VIEW_SIZE, CROP_DIAMETER, MIN_CROP_ZOOM, MAX_CROP_ZOOM, imageCropRect, zoomCrop, wheelCropZoom, type CropTransform } from "./profileCropGeometry";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  onUseOriginal: () => void;
}

const initialTransform: CropTransform = { zoom: 1, x: 0, y: 0 };

export const ImageCropper = ({ imageSrc, onCropComplete, onCancel, onUseOriginal }: ImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState<CropTransform>(initialTransform);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const transformRef = useRef(transform);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const update = (next: CropTransform) => { transformRef.current = next; setTransform(next); };

  useEffect(() => {
    let active = true;
    setImage(null);
    transformRef.current = initialTransform;
    setTransform(initialTransform);
    pointers.current.clear();
    const img = new Image();
    img.onload = () => { if (active) setImage(img); };
    img.src = imageSrc;
    return () => { active = false; };
  }, [imageSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const rect = imageCropRect(image.naturalWidth, image.naturalHeight, transform);
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  }, [image, transform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      const anchor = { x: (event.clientX - bounds.left) * CROP_VIEW_SIZE / bounds.width, y: (event.clientY - bounds.top) * CROP_VIEW_SIZE / bounds.height };
      const current = transformRef.current;
      const next = zoomCrop(current, wheelCropZoom(current.zoom, event.deltaY, event.deltaMode), anchor);
      transformRef.current = next;
      setTransform(next);
    };
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => canvas.removeEventListener("wheel", wheel);
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * CROP_VIEW_SIZE / bounds.width, y: (event.clientY - bounds.top) * CROP_VIEW_SIZE / bounds.height };
  };
  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, point(event));
  };
  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const old = pointers.current.get(event.pointerId);
    if (!old) return;
    event.preventDefault();
    const before = Array.from(pointers.current.values()).slice(0, 2);
    const nextPoint = point(event);
    pointers.current.set(event.pointerId, nextPoint);
    const after = Array.from(pointers.current.values()).slice(0, 2);
    const current = transformRef.current;
    if (before.length === 2 && after.length === 2) {
      const midpoint = (p: typeof before) => ({ x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 });
      const distance = (p: typeof before) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      const oldDistance = distance(before);
      if (oldDistance < 1) return;
      const from = midpoint(before), to = midpoint(after);
      const zoomed = zoomCrop(current, current.zoom * distance(after) / oldDistance, from);
      update({ ...zoomed, x: zoomed.x + to.x - from.x, y: zoomed.y + to.y - from.y });
    } else {
      update({ ...current, x: current.x + nextPoint.x - old.x, y: current.y + nextPoint.y - old.y });
    }
  };
  const pointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => { pointers.current.delete(event.pointerId); };
  const changeZoom = (zoom: number) => update(zoomCrop(transformRef.current, zoom));

  const handleCrop = () => {
    if (!image) return;
    const output = document.createElement("canvas");
    output.width = 512;
    output.height = 512;
    const ctx = output.getContext("2d");
    if (!ctx) return;
    const rect = imageCropRect(image.naturalWidth, image.naturalHeight, transformRef.current);
    const margin = (CROP_VIEW_SIZE - CROP_DIAMETER) / 2;
    const ratio = output.width / CROP_DIAMETER;
    ctx.beginPath();
    ctx.arc(256, 256, 256, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, (rect.x - margin) * ratio, (rect.y - margin) * ratio, rect.width * ratio, rect.height * ratio);
    output.toBlob(blob => { if (blob) onCropComplete(blob); }, "image/png");
  };

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      <div className="relative mx-auto w-full max-w-80 aspect-square overflow-hidden rounded-lg border border-border bg-background">
        <canvas ref={canvasRef} width={320} height={320} aria-label="Profile picture crop" className="block w-full h-full cursor-move touch-none" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} />
        <svg viewBox="0 0 320 320" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
          <path d="M0 0H320V320H0Z M160 20a140 140 0 1 0 0 280a140 140 0 1 0 0-280" fillRule="evenodd" className="fill-background opacity-60" />
          <circle cx="160" cy="160" r="140" fill="none" strokeWidth="2" className="stroke-foreground" />
        </svg>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Zoom out" title="Zoom out" onClick={() => changeZoom(transform.zoom / 1.2)} disabled={!image || transform.zoom <= MIN_CROP_ZOOM}><ZoomOut className="w-4 h-4" /></Button>
        <Slider aria-label="Photo zoom" value={[transform.zoom]} onValueChange={value => changeZoom(value[0])} min={MIN_CROP_ZOOM} max={MAX_CROP_ZOOM} step={0.01} disabled={!image} className="min-w-0 flex-1" />
        <Button variant="ghost" size="icon" aria-label="Zoom in" title="Zoom in" onClick={() => changeZoom(transform.zoom * 1.2)} disabled={!image || transform.zoom >= MAX_CROP_ZOOM}><ZoomIn className="w-4 h-4" /></Button>
        <span className="text-sm text-muted-foreground w-12 shrink-0 text-right tabular-nums">{Math.round(transform.zoom * 100)}%</span>
        <Button variant="ghost" size="icon" aria-label="Reset photo framing" title="Reset photo framing" onClick={() => update(initialTransform)} disabled={!image}><RotateCcw className="w-4 h-4" /></Button>
      </div>
      <div className="flex flex-col gap-2">
        <Button onClick={handleCrop} disabled={!image} className="w-full">Crop &amp; Save</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onUseOriginal} className="flex-1">Use Original</Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        </div>
      </div>
    </div>
  );
};
