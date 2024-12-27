import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface BlockUserDialogProps {
  isOpen: boolean;
  userName: string;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BlockUserDialog({
  isOpen,
  userName,
  reason,
  onReasonChange,
  onConfirm,
  onCancel
}: BlockUserDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-2">Block User</h2>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to block {userName}? This will prevent them from sending messages.
        </p>
        <div className="mb-4">
          <Textarea
            placeholder="Reason for blocking (optional)"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Block User
          </Button>
        </div>
      </div>
    </div>
  );
}
