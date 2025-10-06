import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Image, Video, X } from "lucide-react";
import { toast } from "sonner";

interface FileAttachmentsProps {
  onFilesChange?: (files: File[]) => void;
}

export const FileAttachments = ({ onFilesChange }: FileAttachmentsProps) => {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isUnder20MB = file.size <= 20 * 1024 * 1024; // 20MB limit

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not an image or video`);
        return false;
      }
      if (!isUnder20MB) {
        toast.error(`${file.name} exceeds 20MB limit`);
        return false;
      }
      return true;
    });

    const newFiles = [...attachedFiles, ...validFiles];
    setAttachedFiles(newFiles);
    onFilesChange?.(newFiles);
    toast.success(`${validFiles.length} file(s) attached`);
  };

  const removeFile = (index: number) => {
    const newFiles = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(newFiles);
    onFilesChange?.(newFiles);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="file"
          id="file-upload"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" size="sm" asChild>
            <span className="cursor-pointer">
              <Image className="h-4 w-4 mr-2" />
              Add Image/Video
            </span>
          </Button>
        </label>
      </div>

      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div
              key={index}
              className="relative group bg-muted rounded-lg p-2 pr-8 text-sm flex items-center gap-2"
            >
              {file.type.startsWith("image/") ? (
                <Image className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Video className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-destructive/10 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
