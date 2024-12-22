import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type UserSettings {
    userId: ID!
    theme: String!
    language: String!
    notifications: NotificationSettings!
    privacy: PrivacySettings!
    chat: ChatSettings!
    accessibility: AccessibilitySettings!
  }

  type NotificationSettings {
    sound: Boolean!
    desktop: Boolean!
    email: Boolean!
    messagePreview: Boolean!
  }

  type PrivacySettings {
    lastSeen: Boolean!
    profilePhoto: Boolean!
    status: Boolean!
    readReceipts: Boolean!
  }

  type ChatSettings {
    fontSize: String!
    enterToSend: Boolean!
    mediaAutoDownload: Boolean!
    messageGrouping: Boolean!
    bubbleStyle: String!
  }

  type AccessibilitySettings {
    highContrast: Boolean!
    reducedMotion: Boolean!
    fontSize: String!
  }

  input NotificationSettingsInput {
    sound: Boolean
    desktop: Boolean
    email: Boolean
    messagePreview: Boolean
  }

  input PrivacySettingsInput {
    lastSeen: Boolean
    profilePhoto: Boolean
    status: Boolean
    readReceipts: Boolean
  }

  input ChatSettingsInput {
    fontSize: String
    enterToSend: Boolean
    mediaAutoDownload: Boolean
    messageGrouping: Boolean
    bubbleStyle: String
  }

  input AccessibilitySettingsInput {
    highContrast: Boolean
    reducedMotion: Boolean
    fontSize: String
  }

  input UpdateSettingsInput {
    theme: String
    language: String
    notifications: NotificationSettingsInput
    privacy: PrivacySettingsInput
    chat: ChatSettingsInput
    accessibility: AccessibilitySettingsInput
  }

  type Query {
    getUserSettings: UserSettings!
  }

  type Mutation {
    updateUserSettings(input: UpdateSettingsInput!): UserSettings!
  }
`;
