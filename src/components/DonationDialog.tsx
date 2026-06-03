import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarHeart } from "lucide-react";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DonationDialog = ({ open, onOpenChange }: DonationDialogProps) => {
  const [monthlyAmount, setMonthlyAmount] = useState("5.00");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleMonthlyDonate = async () => {
    const amountValue = parseFloat(monthlyAmount);
    
    if (isNaN(amountValue) || amountValue < 1.00) {
      toast({
        title: "Invalid amount",
        description: "Minimum monthly donation is $1.00",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const amountInCents = Math.round(amountValue * 100);
      
      const { data, error } = await supabase.functions.invoke("create-monthly-donation", {
        body: { amount: amountInCents },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Monthly donation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process monthly donation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const monthlyPresets = [5, 10, 20, 50];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarHeart className="w-5 h-5 text-primary" />
            Support OrthoCross
          </DialogTitle>
          <DialogDescription>
            Acts 20:35 - "It is more blessed to give than to receive."
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="monthly-amount">Monthly Amount (USD)</Label>
            <div className="flex gap-2 mb-3">
              {monthlyPresets.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setMonthlyAmount(preset.toFixed(2))}
                  className="flex-1"
                >
                  ${preset}
                </Button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="monthly-amount"
                type="number"
                step="0.01"
                min="1"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                className="pl-7"
                placeholder="5.00"
              />
            </div>
          </div>

          <Button 
            onClick={handleMonthlyDonate} 
            disabled={loading}
            className="w-full"
            variant="sacred"
          >
            {loading ? "Processing..." : "Donate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
