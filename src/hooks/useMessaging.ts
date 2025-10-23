import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  title: string | null;
  created_by: string | null;
  created_at: string;
  participants: {
    user_id: string;
    role: string;
    profile: {
      username: string;
      profile_picture_url: string;
    };
  }[];
  last_message?: {
    body: string;
    created_at: string;
    sender_id: string;
    is_deleted: boolean;
  };
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  edited_at: string | null;
  is_deleted: boolean;
  sender: {
    username: string;
    profile_picture_url: string;
  };
  attachments: {
    id: string;
    kind: 'image' | 'audio' | 'video';
    url: string;
    width?: number;
    height?: number;
    duration_ms?: number;
  }[];
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations (
            id,
            type,
            title,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const conversationIds = participantData.map(p => p.conversation_id);
      
      if (conversationIds.length === 0) return [];

      // Get all participants for these conversations
      const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          role,
          profiles!inner (
            username,
            profile_picture_url
          )
        `)
        .in('conversation_id', conversationIds);

      if (allParticipantsError) throw allParticipantsError;

      // Get last messages
      const { data: lastMessages, error: lastMessagesError } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at, sender_id, is_deleted')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (lastMessagesError) throw lastMessagesError;

      // Group participants by conversation
      const participantsByConvo = allParticipants.reduce((acc, p) => {
        if (!acc[p.conversation_id]) acc[p.conversation_id] = [];
        acc[p.conversation_id].push({
          user_id: p.user_id,
          role: p.role,
          profile: p.profiles
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Group last messages by conversation
      const lastMessagesByConvo = lastMessages.reduce((acc, m) => {
        if (!acc[m.conversation_id]) {
          acc[m.conversation_id] = m;
        }
        return acc;
      }, {} as Record<string, any>);

      const conversations: Conversation[] = participantData
        .map(p => {
          const convo = p.conversations;
          if (!convo) return null;
          
          return {
            ...convo,
            participants: participantsByConvo[convo.id] || [],
            last_message: lastMessagesByConvo[convo.id]
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          const aTime = a.last_message?.created_at || a.created_at;
          const bTime = b.last_message?.created_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

      return conversations;
    },
    enabled: !!user
  });
};

export const useMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!messages || messages.length === 0) return [];

      // Get sender profiles
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')
        .in('id', senderIds);

      if (profileError) throw profileError;

      const profileMap = profiles.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, any>);

      // Get attachments
      const messageIds = messages.map(m => m.id);
      const { data: attachments, error: attachmentError } = await supabase
        .from('attachments')
        .select('*')
        .in('message_id', messageIds);

      if (attachmentError) throw attachmentError;

      const attachmentsByMessage = (attachments || []).reduce((acc, a) => {
        if (!acc[a.message_id]) acc[a.message_id] = [];
        acc[a.message_id].push(a);
        return acc;
      }, {} as Record<string, any[]>);

      return messages.map(m => ({
        ...m,
        sender: profileMap[m.sender_id] || { username: 'Unknown', profile_picture_url: null },
        attachments: attachmentsByMessage[m.id] || []
      })) as Message[];
    },
    enabled: !!conversationId
  });
};

export const useCreateConversation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      type, 
      participantIds, 
      title 
    }: { 
      type: 'dm' | 'group'; 
      participantIds: string[]; 
      title?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if DM already exists
      if (type === 'dm' && participantIds.length === 1) {
        const { data: existingConvos } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversations!inner(type)')
          .eq('user_id', user.id);

        if (existingConvos) {
          for (const convo of existingConvos) {
            const { data: otherParticipant } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', convo.conversation_id)
              .neq('user_id', user.id)
              .single();

            if (otherParticipant && otherParticipant.user_id === participantIds[0]) {
              return convo.conversation_id;
            }
          }
        }
      }

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type,
          title,
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participants = [
        { 
          conversation_id: conversation.id, 
          user_id: user.id,
          role: 'owner' as 'owner' | 'admin' | 'member'
        },
        ...participantIds.map(id => ({
          conversation_id: conversation.id,
          user_id: id,
          role: 'member' as 'owner' | 'admin' | 'member'
        }))
      ];

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantError) throw participantError;

      return conversation.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation created');
    },
    onError: (error) => {
      toast.error('Failed to create conversation');
      console.error(error);
    }
  });
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      body,
      attachments
    }: {
      conversationId: string;
      body?: string;
      attachments?: { kind: 'image' | 'audio' | 'video'; url: string; width?: number; height?: number; duration_ms?: number }[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body
        })
        .select()
        .single();

      if (messageError) throw messageError;

      if (attachments && attachments.length > 0) {
        const { error: attachmentError } = await supabase
          .from('attachments')
          .insert(
            attachments.map(a => ({
              message_id: message.id,
              ...a
            }))
          );

        if (attachmentError) throw attachmentError;
      }

      return message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error('Failed to send message');
      console.error(error);
    }
  });
};

export const useBlockUser = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedUserId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('blocks')
        .insert({
          blocker_id: user.id,
          blocked_id: blockedUserId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('User blocked');
    },
    onError: (error) => {
      toast.error('Failed to block user');
      console.error(error);
    }
  });
};

export const useReportMessage = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      messageId,
      reason,
      note
    }: {
      messageId: string;
      reason: 'abuse' | 'spam' | 'inappropriate' | 'other';
      note?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('message_reports')
        .insert({
          message_id: messageId,
          reporter_id: user.id,
          reason,
          note
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Message reported');
    },
    onError: (error) => {
      toast.error('Failed to report message');
      console.error(error);
    }
  });
};

export const useBlocks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['blocks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('blocks')
        .select(`
          id,
          blocked_id,
          created_at,
          profiles!blocks_blocked_id_fkey (
            username,
            profile_picture_url
          )
        `)
        .eq('blocker_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
};
