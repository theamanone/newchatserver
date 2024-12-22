'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Search } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';

interface Application {
  _id: string;
  name: string;
}

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
  applicationName: string;
}

export default function SuperAdminChats() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch applications
        const appsResponse = await fetch('/api/v1/superadmin/applications');
        const appsData = await appsResponse.json();
        
        if (appsResponse.ok) {
          setApplications(appsData.applications);
        }

        // Fetch all messages
        const messagesResponse = await fetch('/api/v1/superadmin/messages');
        const messagesData = await messagesResponse.json();
        
        if (messagesResponse.ok) {
          setMessages(messagesData.messages);
        } else {
          toast.error(messagesData.error || 'Failed to fetch messages');
        }
      } catch (error) {
        toast.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAppChange = (value: string) => {
    setSelectedApp(value);
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.applicationName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesApp = selectedApp === 'all' || message.applicationId === selectedApp;
    
    return matchesSearch && matchesApp;
  });

  const handleViewChat = (messageId: string, applicationId: string) => {
    router.push(`/superadmin/applications/${applicationId}/chats/${messageId}`);
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
        <h1 className="text-3xl font-bold">All Application Chats</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <Select value={selectedApp} onValueChange={handleAppChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Application" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                {applications.map((app) => (
                  <SelectItem key={app._id} value={app._id}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <Card key={message._id} className="hover:bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{message.sender.name}</p>
                        <span className="text-sm text-gray-500">•</span>
                        <p className="text-sm text-blue-600">{message.applicationName}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                      <p className="mt-2">{message.content}</p>
                    </div>
                    <Button 
                      onClick={() => handleViewChat(message._id, message.applicationId)}
                      variant="outline"
                    >
                      View Chat
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
