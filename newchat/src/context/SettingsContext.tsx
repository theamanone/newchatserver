import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';

interface SettingsContextType {
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  
  // Online Status
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => Promise<void>;
  
  // Notifications
  notifications: {
    sound: boolean;
    desktop: boolean;
    email: boolean;
    messagePreview: boolean;
  };
  updateNotifications: (settings: Partial<SettingsContextType['notifications']>) => Promise<void>;
  
  // Privacy
  privacy: {
    lastSeen: boolean;
    profilePhoto: boolean;
    status: boolean;
    readReceipts: boolean;
  };
  updatePrivacy: (settings: Partial<SettingsContextType['privacy']>) => Promise<void>;
  
  // Chat Settings
  chatSettings: {
    fontSize: string;
    enterToSend: boolean;
    mediaAutoDownload: boolean;
    messageGrouping: boolean;
    bubbleStyle: string;
  };
  updateChatSettings: (settings: Partial<SettingsContextType['chatSettings']>) => Promise<void>;
  
  // Accessibility
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: string;
  };
  updateAccessibility: (settings: Partial<SettingsContextType['accessibility']>) => Promise<void>;
  
  // Loading States
  isLoading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, loading: isLoading, error, updateSettings } = useSettings();
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');
  const [isOnline, setIsOnline] = useState(true);

  // Initialize settings from the server
  useEffect(() => {
    if (settings) {
      setThemeState(settings.theme as 'light' | 'dark' | 'system');
      // Initialize other settings as needed
    }
  }, [settings]);

  // Theme handling with system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);


   // Initialize theme from localStorage
   useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else if (settings) {
      // Fall back to settings from the server if no theme is saved in localStorage
      setThemeState(settings.theme as 'light' | 'dark' | 'system');
      applyTheme(settings.theme as 'light' | 'dark' | 'system');
    }
  }, []);

   // Apply the theme to the document
   const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  // Apply theme changes
  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

 // Update theme
 const setTheme = async (newTheme: 'light' | 'dark' | 'system') => {
  try {
    await updateSettings({ theme: newTheme });
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme); // Save theme to localStorage
    applyTheme(newTheme);
  } catch (error) {
    console.error('Failed to update theme:', error);
  }
};


  const setOnlineStatus = async (status: boolean) => {
    try {
      setIsOnline(status);
      // You might want to sync this with your server or WebSocket connection
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  };

  const updateNotifications = async (newSettings: Partial<SettingsContextType['notifications']>) => {
    try {
      await updateSettings({ notifications: newSettings });
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
  };

  const updatePrivacy = async (newSettings: Partial<SettingsContextType['privacy']>) => {
    try {
      await updateSettings({ privacy: newSettings });
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
    }
  };

  const updateChatSettings = async (newSettings: Partial<SettingsContextType['chatSettings']>) => {
    try {
      await updateSettings({ chat: newSettings });
    } catch (error) {
      console.error('Failed to update chat settings:', error);
    }
  };

  const updateAccessibility = async (newSettings: Partial<SettingsContextType['accessibility']>) => {
    try {
      await updateSettings({ accessibility: newSettings });
    } catch (error) {
      console.error('Failed to update accessibility settings:', error);
    }
  };

  const value: SettingsContextType = {
    theme,
    setTheme,
    isOnline,
    setOnlineStatus,
    notifications: settings?.notifications || {
      sound: true,
      desktop: true,
      email: true,
      messagePreview: true,
    },
    updateNotifications,
    privacy: settings?.privacy || {
      lastSeen: true,
      profilePhoto: true,
      status: true,
      readReceipts: true,
    },
    updatePrivacy,
    chatSettings: settings?.chat || {
      fontSize: 'medium',
      enterToSend: true,
      mediaAutoDownload: true,
      messageGrouping: true,
      bubbleStyle: 'modern',
    },
    updateChatSettings,
    accessibility: settings?.accessibility || {
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
    },
    updateAccessibility,
    isLoading,
    error,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
