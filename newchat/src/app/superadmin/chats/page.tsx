'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Paperclip, Send } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import Loading from '@/components/Loading';

interface Message {
  _id: string;
  content: string;
  sender: string;
  senderRole: string;
  applicationId: string;
  applicationName: string;
  timestamp: string;
  receiver?: string;
  receiverRole?: string;
  mediaUrl?: string;
  fileType?: string;
}

export default function SuperAdminChats() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedApp, setSelectedApp] = useState('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const endpoint = selectedApp === 'all' 
        ? '/api/v1/superadmin/messages'
        : `/api/v1/superadmin/applications/${selectedApp}/messages`;
      const response = await fetch(endpoint, {
        headers: {
          'admin-role': 'superadmin'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        toast.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedApp]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) return;

    try {
      const formData = new FormData();
      if (messageText) formData.append('content', messageText);
      if (selectedFile) formData.append('file', selectedFile);
      if (selectedApp !== 'all') formData.append('applicationId', selectedApp);

      const response = await fetch('/api/v1/superadmin/messages', {
        method: 'POST',
        headers: {
          'admin-role': 'superadmin'
        },
        body: formData,
      });

      if (response.ok) {
        setMessageText('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await fetchMessages();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleReply = async (messageId: string, replyText: string) => {
    if (!replyText.trim() && !selectedFile) return;

    try {
      const formData = new FormData();
      if (replyText) formData.append('content', replyText);
      if (selectedFile) formData.append('file', selectedFile);

      const response = await fetch(`/api/v1/superadmin/messages/${messageId}/reply`, {
        method: 'POST',
        headers: {
          'admin-role': 'superadmin'
        },
        body: formData,
      });

      if (response.ok) {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await fetchMessages();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.applicationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Messages</h1>
          <div className="w-[100px]" /> {/* Spacer for alignment */}
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card className="flex-1 overflow-auto">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="text-lg">No messages found</p>
                  <p className="text-sm">Try adjusting your search or send a new message</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <div key={message._id} className="bg-white p-4 rounded-lg shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold">{message.sender}</span>
                          <span className="text-gray-500 text-sm ml-2">
                            ({message.senderRole})
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            {message.applicationName}
                          </span>
                        </div>
                        <span className="text-gray-500 text-sm">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{message.content}</p>
                      
                      {message.mediaUrl && (
                        <div className="mb-2">
                          {message.fileType?.startsWith('image/') ? (
                            <img 
                              src={message.mediaUrl} 
                              alt="Message attachment" 
                              className="max-w-xs rounded"
                            />
                          ) : (
                            <a 
                              href={message.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              <Paperclip className="h-4 w-4 inline mr-1" />
                              Download Attachment
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleSendMessage}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
