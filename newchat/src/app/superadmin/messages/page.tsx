'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Search, ArrowLeft, Send, Loader2, User, Reply, Image as ImageIcon, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Image from 'next/image';
import { DEFAULT_PROFILE_PICTURE } from '@/lib/data';
import ChatInput from '@/components/chat/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchBar } from '../components/messages/SearchBar';
import { MessageActions } from '../components/messages/MessageActions';
import { BlockUserDialog } from '../components/users/BlockUserDialog';

interface MessageSender {
  _id: string;
  name: string;
  role?: 'admin' | 'superadmin' | 'user';
  profilePicture?: string;
}

interface Message {
  _id: string;
  content: string;
  sender: MessageSender;
  receiver?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'replied';
  applicationId: string;
  applicationName: string;
  messageType: 'text' | 'file' | 'image' | 'audio';
  mediaUrl?: string;
  fileUrl?: string;
  replies?: Message[];
  isReplied?: boolean;
  profilePicture?: string;
}

interface Application {
  _id: string;
  name: string;
  unreadCount?: number;
}

interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}

export default function MessagesPage() {
  const router = useRouter();
  const socketContext = useSocket();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<string | 'all'>('all');
  const [applications, setApplications] = useState<Application[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      searchMessages(debouncedSearch);
    } else if (selectedApp) {
      fetchMessages(selectedApp);
    }
  }, [debouncedSearch, selectedApp]);

  useEffect(() => {
    if (!socketContext || !socketContext.socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prev => {
        // Check if message already exists
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        
        // Add new message with profile picture
        const newMessage = {
          ...message,
          profilePicture: message.sender?.profilePicture || DEFAULT_PROFILE_PICTURE
        };
        
        const newMessages = [...prev, newMessage].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // If scrolled to bottom, scroll to new message
        if (isScrolledToBottom) {
          setTimeout(scrollToBottom, 100);
        }

        return newMessages;
      });

      // Update unread count for the application
      if (message.applicationId !== 'all') {
        setApplications(prev => prev.map(app => {
          if (app._id === message.applicationId) {
            return {
              ...app,
              unreadCount: (app.unreadCount || 0) + 1
            };
          }
          return app;
        }));
      } else {
        setApplications(prev => prev.map(app => ({ ...app, unreadCount: 0 })));
      }
    };

    // Subscribe to new messages when socket is ready
    const subscribeToMessages = () => {
      if (socketContext.socket?.readyState === WebSocket.OPEN) {
        socketContext.subscribeToGroup('superadmin-messages');
        socketContext.onMessageReplied = (messageId, reply) => {
          setMessages(prev => prev.map(msg => {
            if (msg._id === messageId) {
              return {
                ...msg,
                replies: [...(msg.replies || []), reply as Message],
                isReplied: true,
                status: 'replied'
              };
            }
            return msg;
          }));
          if (isScrolledToBottom) {
            setTimeout(scrollToBottom, 100);
          }
        };
      }
    };

    // Initial subscription attempt
    subscribeToMessages();

    // Set up socket state change listener
    const handleSocketStateChange = () => {
      if (socketContext.socket?.readyState === WebSocket.OPEN) {
        subscribeToMessages();
      }
    };

    socketContext.socket.addEventListener('open', handleSocketStateChange);

    return () => {
      if (socketContext.socket?.readyState === WebSocket.OPEN) {
        socketContext.unsubscribeFromGroup('superadmin-messages');
        socketContext.onMessageReplied = undefined;
      }
      socketContext.socket?.removeEventListener('open', handleSocketStateChange);
    };
  }, [socketContext, socketContext?.socket, isScrolledToBottom]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setIsScrolledToBottom(isBottom);

    // Load more messages when scrolling to top
    if (scrollTop === 0 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/v1/superadmin/applications', {
        headers: {
          'admin-role': 'superadmin',
          'admin-id': 'superadmin'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data.applications);
      if (data.applications.length > 0 && !selectedApp) {
        setSelectedApp(data.applications[0]._id);
        await fetchMessages(data.applications[0]._id);
      }
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (appId: string | 'all', cursor?: string, direction: 'older' | 'newer' = 'newer') => {
    try {
      const url = new URL('/api/v1/superadmin/messages', window.location.origin);
      if (appId !== 'all') {
        url.searchParams.append('applicationId', appId);
      }
      if (cursor) url.searchParams.append('cursor', cursor);
      url.searchParams.append('direction', direction);

      const response = await fetch(url, {
        headers: {
          'admin-role': 'superadmin',
          'admin-id': 'superadmin'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data: MessagesResponse = await response.json();
      
      if (!cursor) {
        setMessages(data.messages.map(message => ({
          ...message,
          profilePicture: message.sender?.profilePicture || DEFAULT_PROFILE_PICTURE
        })));
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
        setTimeout(scrollToBottom, 100);
      } else {
        setMessages(prev => [...data.messages.map(message => ({
          ...message,
          profilePicture: message.sender?.profilePicture || DEFAULT_PROFILE_PICTURE
        })), ...prev]);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      }

      // Reset unread count for selected app
      if (appId !== 'all') {
        setApplications(prev => prev.map(app => 
          app._id === appId ? { ...app, unreadCount: 0 } : app
        ));
      } else {
        setApplications(prev => prev.map(app => ({ ...app, unreadCount: 0 })));
      }
    } catch (error) {
      toast.error('Failed to fetch messages');
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedApp || !nextCursor || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      await fetchMessages(selectedApp, nextCursor, 'older');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleAppSelect = async (appId: string | 'all') => {
    setSelectedApp(appId);
    setMessages([]);
    setNextCursor(null);
    setHasMore(false);
    await fetchMessages(appId);
  };

  const handleSendMessage = async (content: any) => {
    if (!socketContext) return;
    if (selectedApp === 'all' && !replyingTo) {
      toast.error('Please select an application to send a message');
      return;
    }

    const targetAppId = replyingTo ? replyingTo.applicationId : selectedApp;

    try {
      if (replyingTo) {
        socketContext.sendMessageReply(replyingTo._id, content.message || content.fileUrl || content.mediaUrl, 'superadmin');
        handleCancelReply();
      } else {
        const message = {
          content: content.message || '',
          applicationId: targetAppId,
          messageType: content.type || 'text',
          mediaUrl: content.mediaUrl,
          fileUrl: content.fileUrl
        };

        const response = await fetch('/api/v1/superadmin/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'admin-role': 'superadmin',
            'admin-id': 'superadmin'
          },
          body: JSON.stringify(message)
        });

        if (!response.ok) throw new Error('Failed to send message');

        const data = await response.json();
        setMessages(prev => [...prev, { ...data.message, profilePicture: DEFAULT_PROFILE_PICTURE }]);
        
        if (isScrolledToBottom) {
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleStartReply = (messageId: string) => {
    const message = messages.find(m => m._id === messageId);
    if (message) {
      setReplyingTo(message);
    }
    // Focus the input
    const input = document.querySelector('input[name="reply"]') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const searchMessages = async (query: string) => {
    setIsSearching(true);
    try {
      const url = new URL('/api/v1/superadmin/messages/search', window.location.origin);
      url.searchParams.append('query', query);
      if (selectedApp !== 'all') {
        url.searchParams.append('applicationId', selectedApp);
      }

      const response = await fetch(url, {
        headers: {
          'admin-role': 'superadmin',
          'admin-id': 'superadmin'
        }
      });

      if (!response.ok) throw new Error('Failed to search messages');
      const data = await response.json();

      setMessages(data.messages);
      setHasMore(data.hasMore);
      setNextCursor(null); // Reset cursor for search results
    } catch (error) {
      toast.error('Failed to search messages');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    setSelectedMessage(message);
    setIsDeleting(true);
  };

  const confirmDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      const response = await fetch(`/api/v1/superadmin/messages/${selectedMessage._id}`, {
        method: 'DELETE',
        headers: {
          'admin-role': 'superadmin',
          'admin-id': 'superadmin'
        }
      });

      if (!response.ok) throw new Error('Failed to delete message');

      setMessages(prev => prev.filter(m => m._id !== selectedMessage._id));
      toast.success('Message deleted successfully');
    } catch (error) {
      toast.error('Failed to delete message');
    } finally {
      setIsDeleting(false);
      setSelectedMessage(null);
    }
  };

  const handleBlockUser = async (user: { id: string; name: string }) => {
    setSelectedUser(user);
    setIsBlocking(true);
  };

  const confirmBlockUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/v1/superadmin/users/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin-role': 'superadmin',
          'admin-id': 'superadmin'
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: blockReason
        })
      });

      if (!response.ok) throw new Error('Failed to block user');

      toast.success(`${selectedUser.name} has been blocked`);
    } catch (error) {
      toast.error('Failed to block user');
    } finally {
      setIsBlocking(false);
      setSelectedUser(null);
      setBlockReason('');
    }
  };

  const filteredMessages = messages.filter(message => {
    const searchLower = searchQuery.toLowerCase();
    return (
      message.content.toLowerCase().includes(searchLower) ||
      message.sender?.name?.toLowerCase().includes(searchLower) ||
      message.applicationName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl h-screen flex flex-col max-h-[100vh]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      <div className="grid md:grid-cols-4 gap-6 flex-1">
        {/* Applications List */}
        <Card className="md:col-span-1 overflow-y-auto">
          <CardContent className="p-4">
            <Button
              variant={selectedApp === 'all' ? 'default' : 'outline'}
              className="w-full justify-start mb-2"
              onClick={() => handleAppSelect('all')}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              All Messages
              {applications.reduce((sum, app) => sum + (app.unreadCount || 0), 0) > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {applications.reduce((sum, app) => sum + (app.unreadCount || 0), 0)}
                </Badge>
              )}
            </Button>
            
            {applications.map((app:any) => (
              <Button
                key={app._id}
                variant={selectedApp === app._id ? 'default' : 'outline'}
                className="w-full justify-start mb-2"
                onClick={() => handleAppSelect(app._id)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                {app.name}
                {app.unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {app.unreadCount}
                  </Badge>
                )}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card className="md:col-span-3 flex flex-col overflow-y-auto max-h-[600px]">
          <CardContent className="p-4 flex flex-col flex-1">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              isLoading={isSearching}
            />

            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto space-y-4 mb-4 px-4"
              style={{ scrollBehavior: 'smooth' }}
              onScroll={handleScroll}
            >
              {hasMore && (
                <div className="text-center py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreMessages}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}

              {filteredMessages.map((message) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex flex-col ${message.sender.role === 'superadmin' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.sender.role === 'superadmin' 
                        ? 'bg-primary text-primary-foreground ml-auto' 
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={message.profilePicture || DEFAULT_PROFILE_PICTURE}
                            alt={message.sender.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{message.sender.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {message.applicationName}
                            </Badge>
                          </div>
                          <span className="text-xs opacity-70 block">
                            {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>

                      {message.sender.role !== 'superadmin' && (
                        <MessageActions
                          messageId={message._id}
                          userId={message.sender._id}
                          userName={message.sender.name}
                          onDelete={handleDeleteMessage}
                          onBlock={handleBlockUser}
                        />
                      )}
                    </div>
                    
                    {message.messageType === 'text' && (
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    )}

                    {message.messageType === 'image' && (
                      <div>
                        <div className="relative w-full h-48 mt-2">
                          <Image
                            src={message.mediaUrl || ''}
                            alt="Message image"
                            fill
                            className="object-contain"
                          />
                        </div>
                        {message.content && (
                          <p className="mt-2 whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                      </div>
                    )}

                    {message.messageType === 'file' && (
                      <div className="mt-2">
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                        >
                          <File className="h-4 w-4" />
                          Download File
                        </a>
                        {message.content && (
                          <p className="mt-2 whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                      </div>
                    )}

                    {message.replyTo && (
                      <div className="mt-2 p-2 rounded bg-black/5 text-sm">
                        <div className="font-medium">{message.replyTo.sender.name}</div>
                        <p className="opacity-70">{message.replyTo.content}</p>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setReplyingTo(message)}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="sticky bottom-0 left-0 ">
             
              <ChatInput
                onSendMessage={handleSendMessage}
                handleCancelReply={handleCancelReply}
                messageReply={replyingTo}
                disabled={selectedApp === 'all'}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <BlockUserDialog
        isOpen={isBlocking}
        userName={selectedUser?.name || ''}
        reason={blockReason}
        onReasonChange={setBlockReason}
        onConfirm={confirmBlockUser}
        onCancel={() => {
          setIsBlocking(false);
          setSelectedUser(null);
          setBlockReason('');
        }}
      />

      {/* Delete Message Dialog */}
      {isDeleting && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-2">Delete Message</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleting(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteMessage}>
                Delete Message
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
