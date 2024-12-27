'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Message from '../../components/support/Message';
import VoiceRecorder from '../../components/support/VoiceRecorder';

interface Message {
  _id: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  sender: {
    _id: string;
    username: string;
    email?: string;
    avatar?: string;
  };
  receiver: string;
  replyToMessageId?: {
    _id: string;
    content: string;
    sender: {
      username: string;
    };
  };
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  tempId?: string;
  isYour?: boolean;
}

interface ReplyTo {
  messageId: string;
  content: string;
  senderName: string;
}

interface MessageData {
  message: string;
  messageType: string;
  file?: File | null;
  userId: string;
  receiver: string;
  replyToMessageId?: string;
  isGroup: boolean;
  timestamp: string;
}

const getMessageType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
  const type = file.type.split('/')[0];
  switch (type) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    default:
      return 'document';
  }
};

// Socket connection constants
const SOCKET_STATES = {
  CONNECTING: 0,
  CONNECTED: 1,
  DISCONNECTED: 2,
} as const;

type SocketStateType = typeof SOCKET_STATES[keyof typeof SOCKET_STATES];

const SOCKET_CONFIG = {
  PING_INTERVAL: 30000,
  PONG_TIMEOUT: 10000,
  RECONNECT_DELAY: 2000,
} as const;

export default function AdminSupport() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [socketState, setSocketState] = useState<SocketStateType>(SOCKET_STATES.DISCONNECTED);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const pongTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesFetchedRef = useRef(false);
  const isInitialConnectionRef = useRef(true);

  const connectWebSocket = useCallback(() => {
    // Prevent multiple connections
    if (socketRef.current?.readyState === WebSocket.OPEN || 
        socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
    if (!adminId) {
      router.push('/');
      return;
    }

    setSocketState(SOCKET_STATES.CONNECTING);
    const ws = new WebSocket(process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:9000');
    socketRef.current = ws;

    const setupHeartbeat = () => {
      // Clear existing intervals
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);

      // Set up new heartbeat
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
          
          pongTimeoutRef.current = setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          }, SOCKET_CONFIG.PONG_TIMEOUT);
        }
      }, SOCKET_CONFIG.PING_INTERVAL);
    };

    ws.onopen = () => {
      console.log('Admin WebSocket Connected');
      setSocketState(SOCKET_STATES.CONNECTED);
      setIsConnected(true);
      setIsReconnecting(false);
      setError('');
      
      ws.send(JSON.stringify({
        type: 'login',
        data: {
          _id: adminId,
          username: 'Admin',
          role: 'admin',
          isAdmin: true
        }
      }));

      setupHeartbeat();

      // Only fetch messages on initial connection
      if (isInitialConnectionRef.current) {
        fetchMessages();
        isInitialConnectionRef.current = false;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'pong') {
          if (pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current);
          }
          return;
        }
        
        switch (data.type) {
          case 'user_message':
          case 'admin_message':
          case 'message_sent':
            const newMessage = { ...data.data, status: 'delivered' };
            setMessages(prev => {
              if (prev.some(msg => msg._id === newMessage._id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
            scrollToBottom();
            break;
            
          case 'auth_success':
            console.log('Admin authenticated successfully');
            break;
            
          case 'auth_error':
            ws.close();
            break;
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket Closed:', event.code, event.reason);
      setIsConnected(false);
      setSocketState(SOCKET_STATES.DISCONNECTED);
      
      // Clear intervals
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);

      // Only attempt reconnection if not manually closed
      if (event.code !== 1000) {
        setIsReconnecting(true);
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            connectWebSocket();
          }
        }, SOCKET_CONFIG.RECONNECT_DELAY);
      }
    };

    ws.onerror = () => {
      setSocketState(SOCKET_STATES.DISCONNECTED);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Closing normally');
      }
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
    };
  }, [router]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && 
          (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)) {
        connectWebSocket();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectWebSocket]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, 'Closing normally');
      }
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback(async (messageData: MessageData) => {
    try {
      let apiPayload: FormData | Record<string, any>;
      
      if (messageData.file) {
        apiPayload = new FormData();
        apiPayload.append('file', messageData.file);
        apiPayload.append('message', messageData.message);
        apiPayload.append('messageType', messageData.messageType);
        apiPayload.append('userId', messageData.userId);
        apiPayload.append('receiver', messageData.receiver);
        if (messageData.replyToMessageId) {
          apiPayload.append('replyToMessageId', messageData.replyToMessageId);
        }
        apiPayload.append('isGroup', String(messageData.isGroup));
        apiPayload.append('timestamp', messageData.timestamp);
      } else {
        apiPayload = {
          message: messageData.message,
          messageType: messageData.messageType,
          userId: messageData.userId,
          receiver: messageData.receiver,
          replyToMessageId: messageData.replyToMessageId,
          isGroup: messageData.isGroup,
          timestamp: messageData.timestamp,
        };
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${baseUrl}/support/messages`, {
        method: 'POST',
        headers: messageData.file 
          ? undefined 
          : {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
        body: messageData.file ? apiPayload : JSON.stringify(apiPayload)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, []);

  const handleMessageStatus = useCallback((data: any) => {
    setMessages(prev => prev.map(msg => {
      if (msg.tempId === data.tempId || msg._id === data._id) {
        return { ...msg, status: data.status, _id: data._id };
      }
      return msg;
    }));
  }, []);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'user_message':
      case 'admin_message':
        setMessages(prev => [...prev, { ...data.data, status: 'delivered' }]);
        scrollToBottom();
        break;
        
      case 'message_sent':
        handleMessageStatus({ ...data.data, status: 'sent' });
        break;
        
      case 'message_failed':
        handleMessageStatus({ ...data.data, status: 'failed' });
        break;
        
      case 'error':
        setError(data.error);
        break;
    }
  }, [handleMessageStatus]);

  const sendTextMessage = async () => {
    if (!socketRef.current || !newMessage.trim()) return;

    try {
      const data = await sendMessage({
        message: newMessage,
        messageType: 'text',
        userId: process.env.NEXT_PUBLIC_ADMIN_ID || '',
        receiver: messages[messages.length - 1]?.sender._id,
        replyToMessageId: replyTo?.messageId,
        isGroup: false,
        timestamp: new Date().toISOString()
      });
      
      setNewMessage('');
      setReplyTo(null);
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${baseUrl}/support/messages?admin=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setMessages(data.data);
        if (data.data.length > 0) {
          setLastMessageTimestamp(data.data[data.data.length - 1].timestamp);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  }, []);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !socketRef.current) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File size must be less than 15MB');
      return;
    }

    setIsUploading(true);

    try {
      const messageType = getMessageType(file);
      const reader = new FileReader();
      
      reader.onload = () => {
        sendMessage({
          message: '',
          messageType,
          file,
          userId: process.env.NEXT_PUBLIC_ADMIN_ID || '',
          receiver: messages[messages.length - 1]?.sender._id,
          replyToMessageId: replyTo?.messageId,
          isGroup: false,
          timestamp: new Date().toISOString()
        });
        setReplyTo(null);
        setIsUploading(false);
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to send file');
      setIsUploading(false);
    }
  };

  const handleVoiceMessage = async (blob: Blob) => {
    setVoiceBlob(blob);
  };

  const sendVoiceMessage = async () => {
    if (!voiceBlob || !socketRef.current) return;

    setIsUploading(true);

    try {
      const data = await sendMessage({
        message: '',
        messageType: 'audio',
        file: new File([voiceBlob], 'voice-message.webm', { type: 'audio/webm' }),
        userId: process.env.NEXT_PUBLIC_ADMIN_ID || '',
        receiver: messages[messages.length - 1]?.sender._id,
        replyToMessageId: replyTo?.messageId,
        isGroup: false,
        timestamp: new Date().toISOString()
      });
      setReplyTo(null);
      setVoiceBlob(null);
    } catch (err) {
      setError('Failed to send voice message');
    } finally {
      setIsUploading(false);
    }
  };

  const cancelVoiceMessage = () => {
    setVoiceBlob(null);
  };

  const handleReply = (message: Message) => {
    setReplyTo({
      messageId: message._id,
      content: message.content,
      senderName: message.sender.username
    });
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleDelete = async (messageId: string) => {
    try {
      const response = await fetch(`/api/v1/support/messages?messageId=${messageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete message');
      
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (err) {
      setError('Failed to delete message');
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Support</h1>
          <div className="flex items-center space-x-2">
            <span 
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : isReconnecting ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isConnected ? 'Connected' : isReconnecting ? 'Reconnecting...' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {error && error !== 'Connection lost. Attempting to reconnect...' && (
            <div className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}
          <div ref={messageListRef} className="h-[calc(100vh-250px)] overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <Message
                key={msg._id}
                message={msg}
                isAdmin={true}
                onReply={handleReply}
                onDelete={handleDelete}
                onCopy={handleCopy}
                isYour={msg.isYour}
                onRetry={msg.status === 'failed' ? () => {
                  // Remove failed message and resend
                  setMessages(prev => prev.filter(m => m._id !== msg._id));
                  sendMessage({
                    message: msg.content,
                    messageType: msg.messageType,
                    userId: process.env.NEXT_PUBLIC_ADMIN_ID || '',
                    receiver: msg.receiver,
                    replyToMessageId: msg.replyToMessageId?._id,
                    isGroup: false,
                    timestamp: new Date().toISOString()
                  });
                } : undefined}
              />
            ))}
          </div>

          {replyTo && (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Replying to {replyTo.senderName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {replyTo.content}
                </div>
              </div>
              <button
                onClick={cancelReply}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
              >
                ✕
              </button>
            </div>
          )}

          {voiceBlob && (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 flex justify-between items-center">
              <div className="text-sm text-gray-900 dark:text-white">
                Voice message recorded
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={sendVoiceMessage}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  disabled={isUploading}
                >
                  {isUploading ? 'Sending...' : 'Send'}
                </button>
                <button
                  onClick={cancelVoiceMessage}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message..."
                maxLength={1000}
              />
              
              <VoiceRecorder onRecordingComplete={handleVoiceMessage} />
              
              <label className="cursor-pointer bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                📎
              </label>
              
              <button
                onClick={sendTextMessage}
                disabled={!isConnected || isUploading}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isUploading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
