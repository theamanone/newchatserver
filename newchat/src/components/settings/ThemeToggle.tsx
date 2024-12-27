import React from 'react';
import { useSettingsContext } from '@/context/SettingsContext';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

export const ThemeToggle = () => {
  const { theme, setTheme } = useSettingsContext();

  return (
    <div className="flex items-center space-x-4 p-4">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg ${
          theme === 'light' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
        }`}
      >
        <FiSun className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg ${
          theme === 'dark' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
        }`}
      >
        <FiMoon className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-lg ${
          theme === 'system' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
        }`}
      >
        <FiMonitor className="w-5 h-5" />
      </button>
    </div>
  );
};
