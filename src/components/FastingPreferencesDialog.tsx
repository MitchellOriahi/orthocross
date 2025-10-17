import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FastingPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (selectedDays: number[]) => void;
  currentPreferences: number[];
}

const FastingPreferencesDialog = ({ 
  open, 
  onOpenChange, 
  onSave,
  currentPreferences 
}: FastingPreferencesDialogProps) => {
  const [selectedDays, setSelectedDays] = useState<number[]>(currentPreferences);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => b - a)
    );
  };

  const handleSave = () => {
    onSave(selectedDays);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fasting Notification Preferences</DialogTitle>
          <DialogDescription>
            Choose when you'd like to receive reminders before fasts and feasts. 
            You'll always receive a notification on the day of the event.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="day-3"
                checked={selectedDays.includes(3)}
                onCheckedChange={() => toggleDay(3)}
              />
              <Label htmlFor="day-3" className="cursor-pointer">
                3 days before
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="day-2"
                checked={selectedDays.includes(2)}
                onCheckedChange={() => toggleDay(2)}
              />
              <Label htmlFor="day-2" className="cursor-pointer">
                2 days before
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="day-1"
                checked={selectedDays.includes(1)}
                onCheckedChange={() => toggleDay(1)}
              />
              <Label htmlFor="day-1" className="cursor-pointer">
                1 day before
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="day-0"
                checked={selectedDays.includes(0)}
                onCheckedChange={() => toggleDay(0)}
              />
              <Label htmlFor="day-0" className="cursor-pointer">
                Same day
              </Label>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 Monday and Wednesday fasts will only receive same-day notifications
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FastingPreferencesDialog;