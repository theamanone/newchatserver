import { useState, useEffect } from 'react';

const GET_USER_SETTINGS = `
  query GetUserSettings {
    getUserSettings {
      theme
      language
      notifications {
        sound
        desktop
        email
        messagePreview
      }
      privacy {
        lastSeen
        profilePhoto
        status
        readReceipts
      }
      chat {
        fontSize
        enterToSend
        mediaAutoDownload
        messageGrouping
        bubbleStyle
      }
      accessibility {
        highContrast
        reducedMotion
        fontSize
      }
    }
  }
`;

const UPDATE_USER_SETTINGS = `
  mutation UpdateUserSettings($input: UpdateSettingsInput!) {
    updateUserSettings(input: $input) {
      theme
      language
      notifications {
        sound
        desktop
        email
        messagePreview
      }
      privacy {
        lastSeen
        profilePhoto
        status
        readReceipts
      }
      chat {
        fontSize
        enterToSend
        mediaAutoDownload
        messageGrouping
        bubbleStyle
      }
      accessibility {
        highContrast
        reducedMotion
        fontSize
      }
    }
  }
`;

interface UserSettings {
  theme: string;
  language: string;
  notifications: {
    sound: boolean;
    desktop: boolean;
    email: boolean;
    messagePreview: boolean;
  };
  privacy: {
    lastSeen: boolean;
    profilePhoto: boolean;
    status: boolean;
    readReceipts: boolean;
  };
  chat: {
    fontSize: string;
    enterToSend: boolean;
    mediaAutoDownload: boolean;
    messageGrouping: boolean;
    bubbleStyle: string;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: string;
  };
}

interface UpdateSettingsInput {
  theme?: string;
  language?: string;
  notifications?: Partial<UserSettings['notifications']>;
  privacy?: Partial<UserSettings['privacy']>;
  chat?: Partial<UserSettings['chat']>;
  accessibility?: Partial<UserSettings['accessibility']>;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_USER_SETTINGS,
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      setSettings(data.data.getUserSettings);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updatedSettings: UpdateSettingsInput) => {
    try {
      setLoading(true);
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: UPDATE_USER_SETTINGS,
          variables: {
            input: updatedSettings,
          },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      setSettings(data.data.updateUserSettings);
      setError(null);
      return data.data.updateUserSettings;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetchSettings: fetchSettings,
  };
};
