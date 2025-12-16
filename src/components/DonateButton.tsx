import { useState } from "react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DonationDialog } from "./DonationDialog";

export const DonateButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        title="Support OrthoCross"
      >
        <Inbox className="h-5 w-5" />
      </Button>
      <DonationDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};