import React from 'react';
import { useSettingsContext } from '@/context/SettingsContext';

export const PrivacySettings = () => {
  const { privacy, updatePrivacy } = useSettingsContext();

  const handleToggle = (key: keyof typeof privacy) => {
    updatePrivacy({ [key]: !privacy[key] });
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-medium">Privacy Settings</h3>
      <div className="space-y-4">
        {Object.entries(privacy).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </label>
              <p className="text-xs text-gray-500">
                {getPrivacyDescription(key as keyof typeof privacy)}
              </p>
            </div>
            <button
              onClick={() => handleToggle(key as keyof typeof privacy)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                value ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

function getPrivacyDescription(key: string): string {
  const descriptions: Record<string, string> = {
    lastSeen: 'Show when you were last active in the chat',
    profilePhoto: 'Allow others to see your profile photo',
    status: 'Show your online/offline status to others',
    readReceipts: 'Send read receipts when you read messages',
  };
  return descriptions[key] || '';
}
