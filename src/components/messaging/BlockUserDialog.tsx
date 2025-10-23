import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBlockUser } from "@/hooks/useMessaging";

interface BlockUserDialogProps {
  userId: string;
  onClose: () => void;
}

export const BlockUserDialog = ({ userId, onClose }: BlockUserDialogProps) => {
  const blockUser = useBlockUser();

  const handleBlock = async () => {
    await blockUser.mutateAsync(userId);
    onClose();
  };

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block this user?</AlertDialogTitle>
          <AlertDialogDescription>
            This user will no longer be able to send you messages. You can unblock them later in Settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleBlock} disabled={blockUser.isPending}>
            Block User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
