import React from 'react';
import { useSettingsContext } from '@/context/SettingsContext';
import { Switch } from '@headlessui/react';

export const NotificationSettings = () => {
  const { notifications, updateNotifications } = useSettingsContext();

  const toggleSetting = (key: keyof typeof notifications) => {
    updateNotifications({ [key]: !notifications[key] });
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-medium">Notification Settings</h3>
      <div className="space-y-4">
        {Object.entries(notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <label className="text-sm font-medium capitalize">
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </label>
            <Switch
              checked={value}
              onChange={() => toggleSetting(key as keyof typeof notifications)}
              className={`${
                value ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
            >
              <span
                className={`${
                  value ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        ))}
      </div>
    </div>
  );
};
