'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// import VoiceRecorder from '@/components/support/VoiceRecorder';
import { useSocket } from '@/context/SocketContext';
import { useAppContext } from '@/context/useContext';
import VoiceRecorder from '../components/support/VoiceRecorder';
import Message from '../components/support/Message';

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

export default function UserSupport() {
  const { socket, sendUserMessage: socketSendMessage } = useSocket();
  const { account } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = useCallback(async (messageData: any) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('Socket not connected');
      return;
    }

    const tempId = Date.now().toString();
    const newMessage = {
      _id: tempId,
      tempId,
      ...messageData,
      sender: {
        _id: account?._id || 'anonymous',
        username: account?.username || 'Guest',
      },
      status: 'sending',
      timestamp: new Date().toISOString(),
      isYour: true
    };

    // Add message to UI immediately with 'sending' status
    setMessages(prev => [...prev, newMessage]);

    try {
      // First save message to API
      const apiPayload = messageData.file 
        ? (() => {
            const formData = new FormData();
            formData.append('file_0', messageData.file);
            formData.append('message', messageData.content || '');
            formData.append('messageType', messageData.messageType);
            formData.append('userId', account?._id);
            formData.append('receiver', process.env.NEXT_PUBLIC_ADMIN_ID || '');
            formData.append('isGroup', 'false');
            return formData;
          })()
        : {
            message: messageData.content,
            messageType: messageData.messageType,
            userId: account?._id,
            receiver: process.env.NEXT_PUBLIC_ADMIN_ID,
            replyToMessageId: messageData.replyToMessageId?._id,
            isGroup: false,
            timestamp: new Date().toISOString()
          };

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
        throw new Error('Failed to save message');
      }

      const savedMessage = await response.json();

      // Now send through socket with saved message ID
      const socketMessage = {
        type: 'userMessage',
        data: {
          ...newMessage,
          _id: savedMessage.data._id,
          mediaUrl: savedMessage.data.mediaUrl,
          isYour: true
        }
      };

      socket.send(JSON.stringify(socketMessage));

      // Update message in UI with saved ID and mediaUrl
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId 
          ? { 
              ...msg, 
              _id: savedMessage.data._id,
              mediaUrl: savedMessage.data.mediaUrl,
              status: 'sent',
              isYour: true
            }
          : msg
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
      ));
      setError('Failed to send message');
    }
  }, [socket, account]);

  // Handle message status updates
  const handleMessageStatus = useCallback((data: any) => {
    setMessages(prev => prev.map(msg => {
      if (msg.tempId === data.tempId || msg._id === data._id) {
        return { ...msg, status: data.status, _id: data._id };
      }
      return msg;
    }));
  }, []);

  useEffect(() => {
    if (!socket) return;

    setIsConnected(true);

    const handleWebSocketMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
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
    };

    socket.addEventListener('message', handleWebSocketMessage);
    socket.addEventListener('close', () => setIsConnected(false));
    socket.addEventListener('error', () => setError('Connection error occurred'));

    // Load initial messages
    fetchMessages();

    return () => {
      socket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [socket, handleMessageStatus]);

  const fetchMessages = useCallback(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${baseUrl}/support/messages?admin=false`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setMessages(data.data);
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
    if (!file || !socket) return;

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
          content: '',
          messageType,
          fileData: file,
          receiver: process.env.NEXT_PUBLIC_ADMIN_ID || '',
          replyToMessageId: replyTo?.messageId
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
    if (!voiceBlob || !socket) return;

    setIsUploading(true);

    try {
      sendMessage({
        content: '',
        messageType: 'audio',
        fileData: new File([voiceBlob], 'voice-message.webm', { type: 'audio/webm' }),
        receiver: process.env.NEXT_PUBLIC_ADMIN_ID || '',
        replyToMessageId: replyTo?.messageId
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

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const sendTextMessage = async () => {
    if (!socket || !newMessage.trim()) return;

    try {
      sendMessage({
        content: newMessage,
        messageType: 'text',
        receiver: process.env.NEXT_PUBLIC_ADMIN_ID || '',
        replyToMessageId: replyTo?.messageId
      });
      
      setNewMessage('');
      setReplyTo(null);
    } catch (err) {
      setError('Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Chat</h1>
          <div className="flex items-center space-x-4">
            <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-gray-700 dark:text-gray-300">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div ref={messageListRef} className="h-[calc(100vh-250px)] overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <Message
                key={msg._id}
                message={msg}
                isAdmin={false}
                onReply={handleReply}
                onCopy={handleCopy}
                onRetry={msg.status === 'failed' ? () => {
                  // Remove failed message and resend
                  setMessages(prev => prev.filter(m => m._id !== msg._id));
                  sendMessage({
                    content: msg.content,
                    messageType: msg.messageType,
                    receiver: msg.receiver,
                    replyToMessageId: msg.replyToMessageId?._id
                  });
                } : undefined}
              />
            ))}
          </div>

          {error && (
            <div className="p-4 bg-red-500 text-white">
              {error}
            </div>
          )}

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
