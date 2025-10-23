import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, useSendMessage, Conversation, Message } from "@/hooks/useMessaging";
import { ArrowLeft, Send, MoreVertical, Image as ImageIcon, Mic } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportMessageDialog } from "./ReportMessageDialog";
import { BlockUserDialog } from "./BlockUserDialog";

interface MessageThreadProps {
  conversation: Conversation;
  onBack: () => void;
}

export const MessageThread = ({ conversation, onBack }: MessageThreadProps) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(conversation.id);
  const sendMessage = useSendMessage();
  const [messageText, setMessageText] = useState("");
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [blockUserId, setBlockUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!conversation.id) return;

    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        () => {
          // Refetch messages when new one arrives
          window.location.reload(); // Simple reload for now
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    await sendMessage.mutateAsync({
      conversationId: conversation.id,
      body: messageText
    });

    setMessageText("");
  };

  const getConversationTitle = () => {
    if (conversation.type === 'group') {
      return conversation.title || 'Group Chat';
    }
    
    const otherParticipant = conversation.participants.find(p => p.user_id !== user?.id);
    return otherParticipant?.profile?.username || 'Unknown User';
  };

  const getOtherUserId = () => {
    if (conversation.type === 'group') return null;
    return conversation.participants.find(p => p.user_id !== user?.id)?.user_id;
  };

  if (isLoading) {
    return <div className="p-4">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold flex-1">{getConversationTitle()}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {conversation.type === 'dm' && getOtherUserId() && (
              <DropdownMenuItem onClick={() => setBlockUserId(getOtherUserId()!)}>
                Block User
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-muted-foreground">
              Remove Conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center text-xs text-muted-foreground mb-4">
          You can block or report messages anytime
        </div>
        
        {messages?.map((message: Message) => {
          const isOwnMessage = message.sender_id === user?.id;
          
          return (
            <div
              key={message.id}
              className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isOwnMessage && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender?.profile_picture_url || undefined} />
                  <AvatarFallback>
                    {message.sender?.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-lg p-3 ${
                    isOwnMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.is_deleted ? (
                    <p className="text-sm italic">Message removed</p>
                  ) : (
                    <>
                      {message.body && <p className="text-sm">{message.body}</p>}
                      {message.attachments?.map((attachment) => (
                        <div key={attachment.id} className="mt-2">
                          {attachment.kind === 'image' && (
                            <img
                              src={attachment.url}
                              alt="Attachment"
                              className="rounded max-w-full"
                            />
                          )}
                          {attachment.kind === 'audio' && (
                            <audio src={attachment.url} controls className="max-w-full" />
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), 'p')}
                  </span>
                  {!isOwnMessage && !message.is_deleted && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setReportMessageId(message.id)}>
                          Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled>
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" disabled>
            <Mic className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!messageText.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {reportMessageId && (
        <ReportMessageDialog
          messageId={reportMessageId}
          onClose={() => setReportMessageId(null)}
        />
      )}

      {blockUserId && (
        <BlockUserDialog
          userId={blockUserId}
          onClose={() => setBlockUserId(null)}
        />
      )}
    </div>
  );
};
