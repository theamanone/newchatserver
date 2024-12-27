'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';
import { SearchBar } from '@/app/superadmin/components/messages/SearchBar';
import ChatInput from '@/components/chat/Input';
import { MessageBubble } from '@/components/chat/MessageBubble';

// Fixed user ID and name for testing
const TEST_USER_ID = "windsurf7777777777";
const TEST_USER_NAME = "Windsurf User";
const TEST_APPLICATION_ID = "675acdad64125b42d0a935e8";

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    role: string;
  };
  receiver: string;
  timestamp: string;
  status: string;
  messageType: 'text' | 'file' | 'image' | 'audio';
  fileUrl?: string;
  replies?: Message[];
  isReplied?: boolean;
}

export default function UserMessages() {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (message: Message) => {
        setMessages(prev => [message, ...prev]);
      });

      socket.on('messageUpdated', (updatedMessage: Message) => {
        setMessages(prev => prev.map(msg => 
          msg._id === updatedMessage._id ? updatedMessage : msg
        ));
      });

      return () => {
        socket.off('newMessage');
        socket.off('messageUpdated');
      };
    }
  }, [socket]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/v1/messages?applicationId=${TEST_APPLICATION_ID}`, {
        headers: {
          'role': 'user',
          'user-id': TEST_USER_ID,
          'user-name': TEST_USER_NAME
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages);
      } else {
        toast.error(data.error || 'Failed to fetch messages');
      }
    } catch (error) {
      toast.error('Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    searchMessages(value);
  };

  const searchMessages = async (query: string) => {
    try {
      const url = new URL('/api/v1/messages', window.location.origin);
      url.searchParams.append('query', query);

      const response = await fetch(url, {
        headers: {
          'role': 'user',
          'user-id': TEST_USER_ID,
          'user-name': TEST_USER_NAME
        }
      });

      if (!response.ok) throw new Error('Failed to search messages');
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      toast.error('Failed to search messages');
    }
  };

  const handleSendMessage = async (content: any) => {
    try {
      const messageData = {
        content: content?.message,
        messageType: content?.type || 'text',
        replyTo: replyingTo?._id,
        applicationId: TEST_APPLICATION_ID
      };

      const response = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'role': 'user',
          'user-id': TEST_USER_ID,
          'user-name': TEST_USER_NAME
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setReplyingTo(null);
      toast.success('Message sent successfully');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl h-screen flex flex-col max-h-[100vh]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="text-sm text-gray-500">
          Testing as: {TEST_USER_NAME}
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-4 flex flex-col flex-1">
          <SearchBar 
            value={searchQuery}
            onChange={handleSearch}
            isLoading={isLoading}
          />

          <div className="flex-1 overflow-y-auto mt-4 space-y-4 max-h-[600px]">
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwnMessage={message.sender._id === TEST_USER_ID}
                onReply={() => setReplyingTo(message)}
              />
            ))}
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No messages found
              </div>
            )}
          </div>

          <div className="sticky bottom-0 left-0 mt-4">
            <ChatInput
              onSendMessage={handleSendMessage}
              handleCancelReply={handleCancelReply}
              messageReply={replyingTo}
              disabled={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
