import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { openAppStoreForRating } from '@/hooks/useAppRating';

interface AppRatingDialogProps {
  open: boolean;
  onClose: () => void;
}

export const AppRatingDialog = ({ open, onClose }: AppRatingDialogProps) => {
  const handleRate = () => {
    openAppStoreForRating();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
          </div>
          <DialogTitle className="text-xl font-serif">Enjoying OrthoCross?</DialogTitle>
          <DialogDescription className="text-base mt-1">
            Your review helps other Orthodox Christians discover the app. It only takes a moment.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={handleRate} className="w-full">
            Rate OrthoCross ★
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
