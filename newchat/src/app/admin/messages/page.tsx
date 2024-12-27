'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import Loading from '@/components/Loading';
 

interface Message {
  _id: string;
  sender: string;
  senderRole: string;
  content: string;
  timestamp: string;
  applicationId: string;
  applicationName: string;
  receiver?: string;
  receiverRole?: string;
  replyTo?: string;
  mediaUrl?: string;
  fileType?: string;
}

export default function AdminMessages() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/superadmin/messages', {
        headers: {
          'admin-id':  'windsurf99999999999',
          'admin-role': 'admin',
          'admin-application-id': '675acdad64125b42d0a935e8'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchMessages();
    }
  }, [session]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    const formData = new FormData();
    if (messageText) formData.append('content', messageText);
    if (selectedFile) formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/v1/superadmin/messages', {
        method: 'POST',
        body: formData,
        headers: {
          'admin-id': session?.user?.id || '',
          'admin-role': 'admin',
          'admin-application-id': session?.user?.applicationId || ''
        }
      });

      if (response.ok) {
        setMessageText('');
        setSelectedFile(null);
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!replyText.trim() && !selectedFile) return;

    const formData = new FormData();
    if (replyText) formData.append('content', replyText);
    if (selectedFile) formData.append('file', selectedFile);

    try {
      const response = await fetch(`/api/v1/superadmin/messages/${messageId}/reply`, {
        method: 'POST',
        body: formData,
        headers: {
          'admin-id': session?.user?.id || '',
          'admin-role': 'admin',
          'admin-application-id': session?.user?.applicationId || ''
        }
      });

      if (response.ok) {
        setReplyText('');
        setSelectedFile(null);
        setReplyingTo(null);
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      
      {/* Message List */}
      <div className="space-y-4 mb-8">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages found.</p>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold">{message.sender}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({message.senderRole})
                  </span>
                </div>
                <span className="text-gray-500 text-sm">
                  {format(new Date(message.timestamp), 'PPpp')}
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
                      Download Attachment
                    </a>
                  )}
                </div>
              )}

              {message.applicationName && (
                <div className="text-sm text-gray-500 mb-2">
                  Application: {message.applicationName}
                </div>
              )}

              {replyingTo === message._id ? (
                <div className="mt-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Type your reply..."
                  />
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="mb-2"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReply(message._id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Send Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                        setSelectedFile(null);
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReplyingTo(message._id)}
                  className="text-blue-500 hover:underline mt-2"
                >
                  Reply
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="space-y-4">
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="w-full p-4 border rounded"
          placeholder="Type your message..."
        />
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
