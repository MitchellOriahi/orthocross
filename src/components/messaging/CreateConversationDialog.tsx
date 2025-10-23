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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateConversation } from "@/hooks/useMessaging";
import { useFriendsData } from "@/hooks/useFriendsData";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreateConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export const CreateConversationDialog = ({ 
  open, 
  onClose, 
  onConversationCreated 
}: CreateConversationDialogProps) => {
  const { user } = useAuth();
  const { friends } = useFriendsData(user?.id);
  const createConversation = useCreateConversation();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isGroup, setIsGroup] = useState(false);

  const handleSubmit = async () => {
    if (selectedFriends.length === 0) return;

    const conversationId = await createConversation.mutateAsync({
      type: isGroup ? 'group' : 'dm',
      participantIds: selectedFriends,
      title: isGroup ? groupName : undefined
    });

    onConversationCreated(conversationId);
    onClose();
    setSelectedFriends([]);
    setGroupName("");
    setIsGroup(false);
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Select friends to start a conversation with
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-group"
              checked={isGroup}
              onCheckedChange={(checked) => setIsGroup(checked as boolean)}
            />
            <Label htmlFor="is-group">Create group chat</Label>
          </div>

          {isGroup && (
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="mt-2"
              />
            </div>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto">
            <Label>Select Friends</Label>
            {friends?.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => toggleFriend(friend.id)}
              >
                <Checkbox
                  checked={selectedFriends.includes(friend.id)}
                  onCheckedChange={() => toggleFriend(friend.id)}
                />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={friend.profile_picture_url || undefined} />
                  <AvatarFallback>
                    {friend.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{friend.username}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              selectedFriends.length === 0 ||
              (isGroup && !groupName.trim()) ||
              createConversation.isPending
            }
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
