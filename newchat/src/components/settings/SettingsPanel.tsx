import React from 'react';
import { useSettings } from '@/hooks/useSettings';

export const SettingsPanel = () => {
  const { settings, loading, error, updateSettings } = useSettings();

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!settings) return null;

  const handleThemeChange = async (theme: string) => {
    try {
      await updateSettings({ theme });
    } catch (err) {
      console.error('Failed to update theme:', err);
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    try {
      await updateSettings({
        notifications: {
          ...settings.notifications,
          [key]: value,
        },
      });
    } catch (err) {
      console.error('Failed to update notifications:', err);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        
        {/* Theme Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Theme</h3>
          <select
            value={settings.theme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Notification Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Notifications</h3>
          <div className="space-y-2">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  id={key}
                  checked={value as boolean}
                  onChange={(e) => handleNotificationChange(key, e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Privacy</h3>
          <div className="space-y-2">
            {Object.entries(settings.privacy).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  id={key}
                  checked={value as boolean}
                  onChange={(e) =>
                    updateSettings({
                      privacy: {
                        ...settings.privacy,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="mr-2"
                />
                <label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
