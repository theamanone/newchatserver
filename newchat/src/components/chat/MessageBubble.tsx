import { Button } from "@/components/ui/button";
import { Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    role: string;
  };
  timestamp: string;
  messageType: string;
  fileUrl?: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onReply: () => void;
  canReplay: boolean
}

export function MessageBubble({ message, isOwnMessage, onReply, canReplay = false }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
        {!isOwnMessage && (
          <div className="text-sm font-medium mb-1">{message.sender.name}</div>
        )}
        <div className="break-words">{message.content}</div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="opacity-70">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
          {canReplay &&
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 ml-2"
              onClick={onReply}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>}
        </div>
      </div>
    </div>
  );
}
