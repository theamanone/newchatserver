import { getServerSession } from 'next-auth';
import UserSettings from '../app/models/userSettings.model';
import { GraphQLError } from 'graphql';
import { Session } from 'next-auth';
import { Document } from 'mongoose';
import { IUserSettings } from '../app/models/userSettings.model';

interface CustomSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

type UpdateSettingsInput = Partial<{
  theme: string;
  language: string;
  notifications: Partial<IUserSettings['notifications']>;
  privacy: Partial<IUserSettings['privacy']>;
  chat: Partial<IUserSettings['chat']>;
  accessibility: Partial<IUserSettings['accessibility']>;
}>;

type UserSettingsDocument = Document<unknown, {}, IUserSettings> & IUserSettings;

const updateSettingsField = (
  settings: UserSettingsDocument,
  key: keyof UpdateSettingsInput,
  value: any
) => {
  if (value && typeof value === 'object') {
    settings.set(key, {
      ...((settings.get(key) as any).get(key) || {}),
      ...value,
    });
  } else {
    settings.set(key, value);
  }
};

export const resolvers = {
  Query: {
    getUserSettings: async (_: any, __: any, context: any) => {
      try {
        const session = await getServerSession() as CustomSession;
        if (!session?.user) {
          throw new GraphQLError('Not authenticated');
        }

        const settings = await UserSettings.findOne({ userId: session.user.id });
        if (!settings) {
          throw new GraphQLError('Settings not found');
        }

        return settings;
      } catch (error) {
        console.error('Error fetching user settings:', error);
        throw error;
      }
    },
  },

  Mutation: {
    updateUserSettings: async (_: any, { input }: { input: UpdateSettingsInput }, context: any) => {
      try {
        const session = await getServerSession() as CustomSession;
        if (!session?.user) {
          throw new GraphQLError('Not authenticated');
        }

        const settings = await UserSettings.findOne({ userId: session.user.id });
        if (!settings) {
          throw new GraphQLError('Settings not found');
        }

        // Type-safe update of settings
        (Object.keys(input) as Array<keyof UpdateSettingsInput>).forEach((key) => {
          if (input[key] !== undefined) {
            updateSettingsField(settings, key, input[key]);
          }
        });

        await settings.save();
        return settings;
      } catch (error) {
        console.error('Error updating user settings:', error);
        throw error;
      }
    },
  },
};
