import mongoose, { Document, Schema } from "mongoose";

export interface ISupportMessage extends Document {
  sender: string;
  receiver?: string;
  applicationId: mongoose.Types.ObjectId;
  senderRole: 'user' | 'admin' | 'superadmin';
  receiverRole?: 'user' | 'admin' | 'superadmin';
  content: string;
  messageType: "text" | "file" | "voice";
  mediaUrl?: string;
  fileType?: string;
  isDeleted: boolean;
  timestamp: Date;
}

const SupportMessageSchema: Schema<ISupportMessage> = new Schema(
  {
    sender: {
      type: String,
      required: true
    },
    receiver: {
      type: String,
      required: false
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true
    },
    senderRole: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      required: true
    },
    receiverRole: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      required: false
    },
    content: {
      type: String,
      required: true
    },
    messageType: {
      type: String,
      enum: ["text", "file", "voice"],
      default: "text"
    },
    mediaUrl: {
      type: String
    },
    fileType: {
      type: String
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
SupportMessageSchema.index({ sender: 1, applicationId: 1 });
SupportMessageSchema.index({ receiver: 1, applicationId: 1 });
SupportMessageSchema.index({ timestamp: -1 });
SupportMessageSchema.index({ isDeleted: 1 });

// Export the model
export default mongoose.models.SupportMessage || mongoose.model<ISupportMessage>("SupportMessage", SupportMessageSchema);
