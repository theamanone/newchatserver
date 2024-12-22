'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
  };
  receiver: string;
  timestamp: string;
  status: string;
  applicationId: string;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { sendAdminMessage } = useSocket();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/v1/admin/messages', {
          headers: {
            'admin-id': 'windsurf99999999999', // Using static admin ID as requested
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

    fetchMessages();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReply = async (messageId: string) => {
    try {
      // Navigate to chat view with this user
      router.push(`/admin/messages/${messageId}`);
    } catch (error) {
      toast.error('Failed to open chat');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={handleSearch}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <Card key={message._id} className="hover:bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{message.sender.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                      <p className="mt-2">{message.content}</p>
                    </div>
                    <Button 
                      onClick={() => handleReply(message._id)}
                      variant="outline"
                    >
                      Reply
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Status: {message.status}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
