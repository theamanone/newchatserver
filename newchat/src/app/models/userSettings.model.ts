import mongoose, { Document, Schema, Model } from "mongoose";

// Interface for user settings document
export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  theme: "light" | "dark" | "system";
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

// Interface for static methods
interface IUserSettingsModel extends Model<IUserSettings> {
  createDefaultSettings(userId: mongoose.Types.ObjectId): Promise<IUserSettings | null>;
}

// User Settings Schema
const UserSettingsSchema: Schema<IUserSettings, IUserSettingsModel> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  theme: {
    type: String,
    enum: ["light", "dark", "system"],
    default: "system",
  },
  language: {
    type: String,
    default: "en",
  },
  notifications: {
    sound: {
      type: Boolean,
      default: true,
    },
    desktop: {
      type: Boolean,
      default: true,
    },
    email: {
      type: Boolean,
      default: true,
    },
    messagePreview: {
      type: Boolean,
      default: true,
    },
  },
  privacy: {
    lastSeen: {
      type: Boolean,
      default: true,
    },
    profilePhoto: {
      type: Boolean,
      default: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    readReceipts: {
      type: Boolean,
      default: true,
    },
  },
  chat: {
    fontSize: {
      type: String,
      default: "medium",
    },
    enterToSend: {
      type: Boolean,
      default: true,
    },
    mediaAutoDownload: {
      type: Boolean,
      default: true,
    },
    messageGrouping: {
      type: Boolean,
      default: true,
    },
    bubbleStyle: {
      type: String,
      default: "modern",
    },
  },
  accessibility: {
    highContrast: {
      type: Boolean,
      default: false,
    },
    reducedMotion: {
      type: Boolean,
      default: false,
    },
    fontSize: {
      type: String,
      default: "medium",
    },
  },
}, {
  timestamps: true,
});

// Create indexes for better query performance
UserSettingsSchema.index({ userId: 1 });

// Static method to create default settings
UserSettingsSchema.statics.createDefaultSettings = async function(
  userId: mongoose.Types.ObjectId
): Promise<IUserSettings | null> {
  try {
    let settings = await this.findOne({ userId });
    
    if (!settings) {
      settings = await this.create({ userId });
    }
    
    return settings;
  } catch (error) {
    console.error('Error in createDefaultSettings:', error);
    throw error;
  }
};

const UserSettings = mongoose.models.UserSettings as IUserSettingsModel || 
  mongoose.model<IUserSettings, IUserSettingsModel>("UserSettings", UserSettingsSchema);

export default UserSettings;
