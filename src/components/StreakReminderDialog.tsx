import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ReminderTime {
  id: number;
  hour: number;
  minute: number;
  enabled: boolean;
}

interface StreakReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminders: ReminderTime[];
  onAddReminder: () => void;
  onDeleteReminder: (id: number) => void;
  onToggleReminder: (id: number) => void;
  onTimeChange: (id: number, hour: number, minute: number) => void;
}

const StreakReminderDialog = ({ 
  open, 
  onOpenChange, 
  reminders,
  onAddReminder,
  onDeleteReminder,
  onToggleReminder,
  onTimeChange
}: StreakReminderDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Streak Reminder Settings</DialogTitle>
          <DialogDescription>
            Manage your daily reading streak reminders. You can add up to 3 reminders at different times.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center gap-4 p-4 border border-border/50 rounded-lg">
              <Switch
                checked={reminder.enabled}
                onCheckedChange={() => onToggleReminder(reminder.id)}
              />
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={reminder.hour}
                  onChange={(e) => onTimeChange(reminder.id, parseInt(e.target.value), reminder.minute)}
                  className="w-16 px-2 py-1 border border-border rounded text-center bg-background"
                  disabled={!reminder.enabled}
                />
                <span>:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={reminder.minute.toString().padStart(2, '0')}
                  onChange={(e) => onTimeChange(reminder.id, reminder.hour, parseInt(e.target.value))}
                  className="w-16 px-2 py-1 border border-border rounded text-center bg-background"
                  disabled={!reminder.enabled}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteReminder(reminder.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          {reminders.length < 3 && (
            <Button
              variant="outline"
              onClick={onAddReminder}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          )}

          {reminders.length === 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                No reminders set. Add a reminder to get notified about your daily reading streak.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StreakReminderDialog;
