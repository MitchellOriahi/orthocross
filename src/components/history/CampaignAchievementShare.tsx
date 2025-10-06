import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Mail, MessageSquare, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CampaignAchievementShareProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignType: "eastern" | "oriental";
}

export const CampaignAchievementShare = ({ 
  open, 
  onOpenChange,
  campaignType 
}: CampaignAchievementShareProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async () => {
    try {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke('generate-campaign-achievement-image', {
        body: { campaignType }
      });

      if (error) throw error;
      
      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (open && !imageUrl) {
      generateImage();
    }
  }, [open]);

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orthodox-${campaignType}-achievement.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const handleShare = async (method: 'native' | 'email' | 'sms') => {
    if (!imageUrl) return;

    const text = `I just completed the ${campaignType === "eastern" ? "Eastern" : "Oriental"} Orthodox History campaign! Full ${campaignType} armor of God assembled! 🛡️`;
    
    if (method === 'native' && navigator.share) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `orthodox-${campaignType}-achievement.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'Orthodox History Achievement',
          text: text,
          files: [file]
        });
        toast.success("Shared successfully!");
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else if (method === 'email') {
      const subject = encodeURIComponent('My Orthodox History Achievement!');
      const body = encodeURIComponent(`${text}\n\nCheck out my achievement: ${imageUrl}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    } else if (method === 'sms') {
      const body = encodeURIComponent(`${text}\n${imageUrl}`);
      window.open(`sms:?body=${body}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Achievement</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : imageUrl ? (
            <div className="space-y-4">
              <img 
                src={imageUrl} 
                alt="Campaign Achievement" 
                className="w-full rounded-lg shadow-lg"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleDownload}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                
                {navigator.share && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleShare('native')}
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => handleShare('email')}
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => handleShare('sms')}
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Failed to generate image
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
