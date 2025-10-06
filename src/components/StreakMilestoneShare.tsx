import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface StreakMilestoneShareProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streakDays: number;
}

export const StreakMilestoneShare = ({ open, onOpenChange, streakDays }: StreakMilestoneShareProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-streak-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ streakDays }),
      });

      if (!response.ok) throw new Error('Failed to generate image');

      const data = await response.json();
      setImageUrl(data.imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `orthocross-${streakDays}-day-streak.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded!");
  };

  const handleShare = async (method: 'native' | 'email' | 'sms') => {
    if (!imageUrl) {
      await generateImage();
      return;
    }

    const text = `I'm on a ${streakDays} day Bible reading streak with OrthoCross! 🔥`;
    
    try {
      if (method === 'native' && navigator.share) {
        // Convert base64 to blob for native sharing
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `orthocross-${streakDays}-day-streak.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'My OrthoCross Streak',
          text,
          files: [file],
        });
        toast.success("Shared successfully!");
      } else if (method === 'email') {
        window.location.href = `mailto:?subject=My OrthoCross Streak&body=${encodeURIComponent(text)}`;
      } else if (method === 'sms') {
        window.location.href = `sms:?body=${encodeURIComponent(text)}`;
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Sharing failed. Try downloading the image instead.");
    }
  };

  // Generate image when dialog opens
  useState(() => {
    if (open && !imageUrl && !isGenerating) {
      generateImage();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎉 Milestone Reached!</DialogTitle>
          <DialogDescription>
            Congratulations on your {streakDays} day reading streak!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Preview */}
          <div className="bg-muted rounded-lg overflow-hidden aspect-square flex items-center justify-center">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Creating your achievement...</p>
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt={`${streakDays} day streak`} className="w-full h-full object-cover" />
            ) : (
              <p className="text-sm text-muted-foreground">Failed to load image</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Share your achievement with friends and family!
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {navigator.share && (
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

          <Button
            onClick={() => onOpenChange(false)}
            variant="default"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
