// src/app/models/conversation.model.ts
import mongoose, { Document, Schema } from "mongoose";

// Interface for Conversation document
interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[]; // Array of user IDs in the conversation (two-way)
  latestMessage: mongoose.Types.ObjectId | null; // Reference to the latest message in this conversation
  deletedBy: mongoose.Types.ObjectId[]; // Array of user IDs who have deleted the conversation
}

// Conversation Schema
const ConversationSchema: Schema<IConversation> = new Schema(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true, // Ensures at least two participants
    },
    latestMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message", // Reference to the latest message in the conversation
      default: null, // Can be null if no message has been sent yet
    },
    deletedBy: {
      type: [Schema.Types.ObjectId],
      default: [], // Default to an empty array if no one has deleted the conversation
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
