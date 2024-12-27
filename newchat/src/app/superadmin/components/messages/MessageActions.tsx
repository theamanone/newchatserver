import React from 'react';
import { Ban, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageActionsProps {
  messageId: string;
  userId: string;
  userName: string;
  onDelete: (messageId: string) => void;
  onBlock: (userId: string, userName: string) => void;
}

export function MessageActions({ messageId, userId, userName, onDelete, onBlock }: MessageActionsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                onBlock(userId, userName);
                setIsOpen(false);
              }}
            >
              <Ban className="h-4 w-4 mr-2" />
              Block User
            </button>
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              onClick={() => {
                onDelete(messageId);
                setIsOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
