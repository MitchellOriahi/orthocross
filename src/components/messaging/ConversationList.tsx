import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, Conversation } from "@/hooks/useMessaging";
import { Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationList = ({ onSelectConversation }: ConversationListProps) => {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.title || 'Group Chat';
    }
    
    const otherParticipant = conversation.participants.find(p => p.user_id !== user?.id);
    return otherParticipant?.profile?.username || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return null;
    }
    
    const otherParticipant = conversation.participants.find(p => p.user_id !== user?.id);
    return otherParticipant?.profile?.profile_picture_url;
  };

  if (isLoading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Start a chat with a friend to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {conversations.map((conversation) => (
        <Card
          key={conversation.id}
          className="p-3 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => onSelectConversation(conversation)}
        >
          <div className="flex items-center gap-3">
            <Avatar>
              {conversation.type === 'group' ? (
                <AvatarFallback>
                  <Users className="h-5 w-5" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={getConversationAvatar(conversation) || undefined} />
                  <AvatarFallback>
                    {getConversationTitle(conversation).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </>
              )}
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold truncate">
                  {getConversationTitle(conversation)}
                </h3>
                {conversation.last_message && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              
              {conversation.last_message && (
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.last_message.is_deleted 
                    ? 'Message removed' 
                    : conversation.last_message.body || 'Attachment'}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
