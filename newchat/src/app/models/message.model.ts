import mongoose, { Document, Schema } from "mongoose";

// Interface for Message Status per User
interface IMessageStatus {
  userId: mongoose.Types.ObjectId; // ID of the user
  status: "sent" | "delivered" | "read"; // Status for this user
  timestamp: Date; // Timestamp of this status
}

// Interface for Message Document
interface IMessage extends Document {
  sender: mongoose.Types.ObjectId; // ID of the sender
  receiver?: mongoose.Types.ObjectId; // ID of the receiver (for user-to-user messages)
  groupId?: mongoose.Types.ObjectId; // ID of the group (for group messages)
  isGroup: boolean; // Flag to indicate if it's a group message
  content: string; // Content of the message
  messageType: "text" | "image" | "video" | "audio" | "voice" | "document" | "gif" | "link"; // Message type
  mediaUrl?: string; // URL of the media file
  fileType?: string; // MIME type of the media file
  replyToMessageId?: mongoose.Types.ObjectId; // ID of the replied-to message
  status: IMessageStatus[]; // Status array for individual users in group messages
  deletedBy: mongoose.Types.ObjectId[]; // Array of user IDs who deleted the message
  isDeleted: boolean; // True if deleted for everyone
  isEncrypted: boolean; // Indicates if encrypted
  timestamp: Date; // Timestamp of message sent
}

// Message Schema
const MessageSchema: Schema<IMessage> = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return !this.isGroup;
      }, // Required only for user-to-user messages
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: function () {
        return this.isGroup;
      }, // Required only for group messages
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "voice", "document", "gif", "link"],
      default: "text",
    },
    mediaUrl: String, // URL for media files
    fileType: String, // MIME type of media file
    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    status: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
      }
    ],// Array to track status for each user
    deletedBy: {
      type: [Schema.Types.ObjectId], // Array of user IDs who deleted the message
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isEncrypted: {
      type: Boolean,
      default: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Indexing for improved query performance
MessageSchema.index({ sender: 1, receiver: 1, groupId: 1, content: 1, timestamp: -1 });

const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
