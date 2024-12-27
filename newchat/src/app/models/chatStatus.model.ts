import mongoose, { Document, Schema } from "mongoose";

// Interface for Chat Status
interface IChatStatus extends Document {
  messageId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: "sent" | "delivered" | "read";
  updatedAt: Date;
}

// Chat Status Schema
const ChatStatusSchema: Schema<IChatStatus> = new Schema({
  messageId: {
    type: Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexing for performance
ChatStatusSchema.index({ messageId: 1, userId: 1 });

const ChatStatus = mongoose.models.ChatStatus || mongoose.model<IChatStatus>("ChatStatus", ChatStatusSchema);
export default ChatStatus;
