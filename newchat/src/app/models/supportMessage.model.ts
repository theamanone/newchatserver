import mongoose, { Document, Schema } from "mongoose";

interface IMessageStatus {
  userId: string;  
  status: "sent" | "delivered" | "read";
  timestamp: Date;
}

export interface ISupportMessage extends Document {
  sender: string;  // Format: "appname+phonenumber"
  receiver: string;  // Format: "appname+phonenumber"
  applicationId: mongoose.Types.ObjectId;
  senderRole: 'user' | 'admin' | 'superadmin';
  receiverRole: 'user' | 'admin' | 'superadmin';
  content: string;
  messageType: "text" | "file" | "voice";
  mediaUrl?: string;
  fileType?: string;
  replyToMessageId?: mongoose.Types.ObjectId;
  status: IMessageStatus[];
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
      required: true
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      required: true
    },
    receiverRole: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      required: true
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "file", "voice"],
      default: "text",
    },
    mediaUrl: String,
    fileType: String,
    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: "SupportMessage",
    },
    status: [{
      userId: String,
      status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
SupportMessageSchema.index({ applicationId: 1, timestamp: -1 });
SupportMessageSchema.index({ sender: 1, applicationId: 1 });
SupportMessageSchema.index({ receiver: 1, applicationId: 1 });

export default mongoose.models.SupportMessage || mongoose.model<ISupportMessage>("SupportMessage", SupportMessageSchema);
