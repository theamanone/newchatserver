import React from 'react';
import { useSettingsContext } from '@/context/SettingsContext';

export const ChatSettings = () => {
  const { chatSettings, updateChatSettings } = useSettingsContext();

  const handleToggle = (key: keyof typeof chatSettings) => {
    if (typeof chatSettings[key] === 'boolean') {
      updateChatSettings({ [key]: !chatSettings[key] });
    }
  };

  const handleSelectChange = (key: keyof typeof chatSettings, value: string) => {
    updateChatSettings({ [key]: value });
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-medium">Chat Settings</h3>
      
      {/* Font Size Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Font Size</label>
        <select
          value={chatSettings.fontSize}
          onChange={(e) => handleSelectChange('fontSize', e.target.value)}
          className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Bubble Style Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Bubble Style</label>
        <select
          value={chatSettings.bubbleStyle}
          onChange={(e) => handleSelectChange('bubbleStyle', e.target.value)}
          className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
        >
          <option value="modern">Modern</option>
          <option value="classic">Classic</option>
        </select>
      </div>

      {/* Toggle Settings */}
      <div className="space-y-4">
        {Object.entries(chatSettings)
          .filter(([_, value]) => typeof value === 'boolean')
          .map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm font-medium capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </label>
              <button
                onClick={() => handleToggle(key as keyof typeof chatSettings)}
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
