import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserSettings from "./userSettings.model";

// Interface for user document
interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  isActive: boolean;
  isSuspended: boolean;
  isVerified: boolean;
  lastSeen: Date;
  blockedUsers: mongoose.Types.ObjectId[];
  sessions: any;
  chatGroups: mongoose.Types.ObjectId[];
  settings: mongoose.Types.ObjectId;  // Reference to UserSettings
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(deviceId: string): string | null;
  generateRefreshToken(deviceId: string): string | null;
}

// User Schema
const UserSchema: Schema<IUser> = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verificationTokenExpires: {
    type: Date,
    default: null,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  avatar: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  blockedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  sessions: [
    {
      deviceId: { type: String, required: true },
      loginAt: { type: Date, default: Date.now },
      deviceType: { type: String, default: "Unknown" },
      ipAddress: { type: String, default: "Unknown" },
    },
  ],
  chatGroups: [
    {
      type: Schema.Types.ObjectId,
      ref: "Group",
    },
  ],
  settings: {
    type: Schema.Types.ObjectId,
    ref: 'UserSettings'
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Password hashing before saving
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate access token
UserSchema.methods.generateAccessToken = function (deviceId: string): string | null {
  const tokenData = {
    id: this._id,
    username: this.username,
    email: this.email,
    deviceId: deviceId // Add deviceId to the payload
  };

  return jwt.sign(tokenData, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "10d" });
};

// Method to generate refresh token
UserSchema.methods.generateRefreshToken = function (deviceId: string): string | null {
  const tokenData = {
    id: this._id,
    deviceId: deviceId // Add deviceId to the payload
  };

  return jwt.sign(tokenData, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "30d" });
};

// Add a method to remove a session by deviceId in the User model

UserSchema.methods.removeSessionByDeviceId = async function (deviceId: string) {
  this.sessions = this.sessions.filter((session: any) => session.deviceId !== deviceId);
  await this.save();
};

// Method to clear all sessions (useful for a complete logout)
UserSchema.methods.clearAllSessions = async function () {
  this.sessions = [];
  await this.save();
};

// Add middleware to create settings when a new user is created
UserSchema.post<IUser>('save', async function(doc:any) {
  try {
    // The _id is already an ObjectId in the IUser document
    await UserSettings.createDefaultSettings(doc._id);
  } catch (error) {
    console.error('Error creating user settings:', error);
  }
});

// Indexing for performance
UserSchema.index({ username: 1, email: 1 });

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
