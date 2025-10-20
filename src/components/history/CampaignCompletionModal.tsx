import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DoveMascot } from "../DoveMascot";
import { Button } from "@/components/ui/button";
import { Sparkles, Share2 } from "lucide-react";
import { CampaignAchievementShare } from "./CampaignAchievementShare";
import { useMusic } from "@/contexts/MusicContext";

interface CampaignCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignType: "eastern" | "oriental";
}

export const CampaignCompletionModal = ({
  isOpen,
  onClose,
  campaignType
}: CampaignCompletionModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const { playSound } = useMusic();

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      playSound('island'); // Play sound when campaign is completed
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, playSound]);

  const title = campaignType === "eastern" 
    ? "Full Eastern Armor of God Assembled!" 
    : "Full Oriental Armor of God Assembled!";

  const message = "You've completed all islands in this campaign!";

  return (
    <>
      <Dialog open={isOpen}>
        <DialogContent 
          className="max-w-md [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6">
            {/* Animated Dove */}
            <div className="relative">
              <DoveMascot size="lg" animated />
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <Sparkles
                      key={i}
                      className="absolute text-primary animate-ping"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: "1s"
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Congratulations Message */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-foreground">
                Congratulations!
              </h2>
              <p className="text-xl font-semibold text-primary">
                {title}
              </p>
              <p className="text-lg text-muted-foreground">
                {message}
              </p>
            </div>

            {/* Achievement Display */}
            <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-gradient-peaceful w-full">
              <div className="text-6xl">🛡️</div>
              <p className="text-sm text-center text-muted-foreground">
                You've mastered all the history lessons of the {campaignType} Orthodox Church!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setShowShare(true)}
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="sacred" 
                size="lg" 
                onClick={onClose}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CampaignAchievementShare
        open={showShare}
        onOpenChange={setShowShare}
        campaignType={campaignType}
      />
    </>
  );
};
