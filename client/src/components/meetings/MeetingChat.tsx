import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { format } from 'date-fns';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  messageType: 'text' | 'system' | 'file';
  createdAt: string;
}

interface MeetingChatProps {
  meetingId: string;
  currentUserId: string;
  className?: string;
}

export default function MeetingChat({
  meetingId,
  currentUserId,
  className,
}: MeetingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseClient();

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [meetingId]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`meeting-chat-${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_messages',
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => {
          loadMessage(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedMessages: ChatMessage[] = data.map((msg: any) => ({
          id: msg.id,
          userId: msg.user_id,
          userName: msg.profiles?.full_name || 'Unknown',
          userAvatar: msg.profiles?.avatar_url,
          content: msg.content,
          messageType: msg.message_type,
          createdAt: msg.created_at,
        }));

        setMessages(formattedMessages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadMessage = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('meeting_messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('id', messageId)
        .single();

      if (error) throw error;

      if (data) {
        const formattedMessage: ChatMessage = {
          id: data.id,
          userId: data.user_id,
          userName: data.profiles?.full_name || 'Unknown',
          userAvatar: data.profiles?.avatar_url,
          content: data.content,
          messageType: data.message_type,
          createdAt: data.created_at,
        };

        setMessages((prev) => [...prev, formattedMessage]);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading message:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('meeting_messages')
        .insert({
          meeting_id: meetingId,
          user_id: currentUserId,
          content: newMessage.trim(),
          message_type: 'text',
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isCurrentUser = message.userId === currentUserId;
            const isSystem = message.messageType === 'system';

            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-muted text-muted-foreground text-sm px-3 py-1 rounded-full">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={message.userAvatar} alt={message.userName} />
                  <AvatarFallback className="text-xs">
                    {getInitials(message.userName)}
                  </AvatarFallback>
                </Avatar>

                <div className={`flex flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {message.userName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !newMessage.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

