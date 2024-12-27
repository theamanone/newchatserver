import React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { DEFAULT_PROFILE_PICTURE } from '@/lib/data';

interface MessageProps {
  message:any
  isAdmin: boolean;
  onReply?: (message: any) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  isYour?: boolean;
  onRetry?: () => void
}

const Message: React.FC<MessageProps> = ({
  message,
  isAdmin,
  onReply,
  onDelete,
  onCopy,
  onRetry,
  isYour = true
}) => {
 
  const [showOptions, setShowOptions] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) onCopy(message.content);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(message._id);
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReply) onReply(message);
  };

  return (
    <div
      className={`flex ${isYour ? 'justify-end' : 'justify-start'} mb-4`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div
        className={`relative max-w-[70%] group ${
          isYour
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
        } rounded-lg p-3`}
      >
        {/* Sender Info */}
        {!isYour && (
          <div className="flex items-center space-x-2 mb-1">
            <div className="relative w-6 h-6 rounded-full overflow-hidden">
              <Image
                src={message?.sender?.avatar || DEFAULT_PROFILE_PICTURE}
                alt={message?.sender?.username}
                fill
                className="object-cover"
              />
            </div>
            <span className="font-semibold text-sm" title={message?.sender?.email}>
              {message?.sender?.username}
            </span>
          </div>
        )}

        {/* Reply Context */}
        {message?.replyToMessageId && (
          <div className={`text-sm mb-2 p-2 rounded ${
            isYour ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            <div className="font-semibold">{message?.replyToMessageId?.sender?.username}</div>
            <div className="truncate">{message?.replyToMessageId?.content}</div>
          </div>
        )}

        {/* Message Content */}
        {message?.messageType === 'text' && (
          <div className="break-words">{message?.content}</div>
        )}

        {message.messageType === 'file' && message.mediaUrl && (
          <div className="mt-2">
            {message.mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <Image
                src={message.mediaUrl}
                alt="Uploaded content"
                width={200}
                height={200}
                className="rounded-lg"
              />
            ) : (
              <a
                href={message.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-300 hover:text-blue-400"
              >
                <span>📎</span>
                <span>View File</span>
              </a>
            )}
          </div>
        )}

        {message.messageType === 'voice' && message.mediaUrl && (
          <div className="mt-2">
            <audio controls className="max-w-full">
              <source src={message.mediaUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs opacity-70 mt-1">
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </div>

        {/* Message Options */}
        {showOptions && (
          <div className={`absolute ${isYour ? 'left-0' : 'right-0'} top-0 -translate-x-full flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1`}>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              title="Copy message"
            >
              📋
            </button>
            
            {(isAdmin || message.sender._id === process.env.NEXT_PUBLIC_ADMIN_ID) && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-red-500"
                title="Delete message"
              >
                🗑️
              </button>
            )}

            {isAdmin && !isYour && (
              <button
                onClick={handleReply}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                title="Reply"
              >
                ↩️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
