import mongoose, { Document, Schema } from "mongoose";

export interface ISuspendedUser extends Document {
  userId: string; // Format: "appname+phonenumber"
  applicationId: mongoose.Types.ObjectId;
  reason?: string;
  suspendedBy: string; // Admin's userId who suspended this user
  suspendedAt: Date;
  suspendedUntil?: Date; // Optional, for temporary suspensions
}

const SuspendedUserSchema: Schema<ISuspendedUser> = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: "Application",
    required: true,
  },
  reason: {
    type: String,
  },
  suspendedBy: {
    type: String,
    required: true,
  },
  suspendedAt: {
    type: Date,
    default: Date.now,
  },
  suspendedUntil: {
    type: Date,
  },
});

// Compound index to ensure unique suspension per application
SuspendedUserSchema.index({ userId: 1, applicationId: 1 }, { unique: true });

export default mongoose.models.SuspendedUser || mongoose.model<ISuspendedUser>("SuspendedUser", SuspendedUserSchema);
