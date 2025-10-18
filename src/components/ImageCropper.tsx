import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  onUseOriginal: () => void;
}

export const ImageCropper = ({ imageSrc, onCropComplete, onCancel, onUseOriginal }: ImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState([1]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Center the image initially
      const canvas = canvasRef.current;
      if (canvas) {
        const cropSize = Math.min(canvas.width, canvas.height);
        setPosition({
          x: (cropSize - img.width) / 2,
          y: (cropSize - img.height) / 2
        });
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image with current scale and position
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale[0], scale[0]);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.drawImage(image, position.x, position.y);
    ctx.restore();

    // Draw circular crop overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, [image, scale, position]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20;

    // Create a new canvas for the cropped image
    const croppedCanvas = document.createElement('canvas');
    const size = radius * 2;
    croppedCanvas.width = size;
    croppedCanvas.height = size;
    const ctx = croppedCanvas.getContext('2d');
    
    if (!ctx) return;

    // Draw the circular crop
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw the scaled and positioned image
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.scale(scale[0], scale[0]);
    ctx.translate(-size / 2, -size / 2);
    
    const offsetX = position.x - (centerX - size / 2);
    const offsetY = position.y - (centerY - size / 2);
    ctx.drawImage(image, offsetX, offsetY);
    ctx.restore();

    // Convert to blob
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/png');
  };

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      <div className="relative w-full flex justify-center">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="border border-border rounded-lg cursor-move max-w-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <ZoomIn className="w-4 h-4 flex-shrink-0" />
          <Slider
            value={scale}
            onValueChange={setScale}
            min={0.5}
            max={3}
            step={0.1}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-12 text-right">{Math.round(scale[0] * 100)}%</span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Drag to reposition • Use slider to zoom
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={handleCrop} className="w-full">
          Crop & Save
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onUseOriginal} className="flex-1">
            Use Original
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};