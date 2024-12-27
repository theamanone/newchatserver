'use client';

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';
import { Trash2, FileText, Image, Mic } from 'lucide-react';

interface MessageSender {
  _id: string;
  name: string;
  role?: 'admin' | 'superadmin' | 'user';
}

interface MessageReply {
  _id: string;
  content: string;
  sender: MessageSender;
  timestamp: string;
  messageType: 'text' | 'file' | 'image' | 'audio';
  fileUrl?: string;
}

interface AdminMessageProps {
  _id: string;
  content: string;
  sender: MessageSender;
  timestamp: string;
  applicationId: string;
  applicationName: string;
  status: string;
  messageType: 'text' | 'file' | 'image' | 'audio';
  fileUrl?: string;
  replies?: MessageReply[];
  isReplied?: boolean;
  userRole: 'admin' | 'superadmin';
  onViewChat: (messageId: string, applicationId: string) => void;
}

export const AdminMessage: React.FC<AdminMessageProps> = ({
  _id,
  content,
  sender,
  timestamp,
  applicationId,
  applicationName,
  status,
  messageType,
  fileUrl,
  replies,
  isReplied,
  userRole,
  onViewChat,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { sendAdminMessage } = useSocket();

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      const replyPayload = {
        messageId: _id,
        content: replyContent,
        applicationId,
        messageType: 'text',
        senderRole: userRole
      };

      sendAdminMessage(replyPayload);
      setReplyContent('');
      setIsReplying(false);
      toast.success('Reply sent successfully');
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/v1/admin/messages/${_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Message deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete message');
      }
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const renderMessageContent = () => {
    switch (messageType) {
      case 'text':
        return <p className="mt-2">{content}</p>;
      case 'file':
        return (
          <div className="mt-2 flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Download File
            </a>
          </div>
        );
      case 'image':
        return (
          <div className="mt-2">
            <img src={fileUrl} alt="Message Image" className="max-w-sm rounded-lg" />
          </div>
        );
      case 'audio':
        return (
          <div className="mt-2 flex items-center space-x-2">
            <Mic className="h-5 w-5" />
            <audio controls src={fileUrl} className="max-w-sm" />
          </div>
        );
      default:
        return <p className="mt-2">{content}</p>;
    }
  };

  return (
    <Card className="hover:bg-gray-50">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-medium">{sender.name}</p>
              <span className="text-sm text-gray-500">•</span>
              <p className="text-sm text-blue-600">{applicationName}</p>
              {sender.role && (
                <span className={`px-2 py-1 text-xs rounded ${
                  sender.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 
                  sender.role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {sender.role}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {new Date(timestamp).toLocaleString()}
            </p>
            
            {renderMessageContent()}

            {/* Show replies */}
            {replies && replies.length > 0 && (
              <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                {replies.map((reply) => (
                  <div key={reply._id} className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{reply.sender.name}</p>
                      <span className={`px-2 py-1 text-xs rounded ${
                        reply.sender.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {reply.sender.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(reply.timestamp).toLocaleString()}
                    </p>
                    {reply.messageType === 'text' ? (
                      <p className="mt-1">{reply.content}</p>
                    ) : (
                      <div className="mt-1">
                        {reply.messageType === 'image' ? (
                          <img src={reply.fileUrl} alt="Reply Image" className="max-w-xs rounded-lg" />
                        ) : reply.messageType === 'audio' ? (
                          <audio controls src={reply.fileUrl} className="max-w-xs" />
                        ) : (
                          <a href={reply.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Download File
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Reply input */}
            {isReplying && (
              <div className="mt-4 space-y-2">
                <Input
                  placeholder="Type your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleReply}
                    disabled={!replyContent.trim()}
                  >
                    Send Reply
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {!isReplying && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setIsReplying(true)}
                >
                  Reply
                </Button>
                <Button 
                  onClick={() => onViewChat(_id, applicationId)}
                  variant="outline"
                >
                  View Chat
                </Button>
                {(userRole === 'superadmin' || (userRole === 'admin' && sender.role !== 'superadmin')) && (
                  <Button 
                    variant="ghost"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Status: {status}
          {isReplied && (
            <span className="ml-2 text-green-600">• Replied</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
