import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useReportMessage } from "@/hooks/useMessaging";

interface ReportMessageDialogProps {
  messageId: string;
  onClose: () => void;
}

export const ReportMessageDialog = ({ messageId, onClose }: ReportMessageDialogProps) => {
  const [reason, setReason] = useState<'abuse' | 'spam' | 'inappropriate' | 'other'>('inappropriate');
  const [note, setNote] = useState("");
  const reportMessage = useReportMessage();

  const handleSubmit = async () => {
    await reportMessage.mutateAsync({
      messageId,
      reason,
      note: note || undefined
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Message</DialogTitle>
          <DialogDescription>
            Help us understand why you're reporting this message
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={(v: any) => setReason(v)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="abuse" id="abuse" />
              <Label htmlFor="abuse">Abuse or harassment</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spam" id="spam" />
              <Label htmlFor="spam">Spam</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inappropriate" id="inappropriate" />
              <Label htmlFor="inappropriate">Inappropriate content</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other">Other</Label>
            </div>
          </RadioGroup>

          <div>
            <Label htmlFor="note">Additional details (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Provide any additional context..."
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={reportMessage.isPending}
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
