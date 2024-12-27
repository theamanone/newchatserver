import mongoose, { Document, Schema } from "mongoose";

// Interface for Group document
interface IGroup extends Document {
  name: string;
  adminIds: mongoose.Types.ObjectId[];
  memberIds: mongoose.Types.ObjectId[];
  groupPicUrl?: string;
  isDeleted: boolean;
  canSendMessages: boolean;
}

// Group Schema
const GroupSchema: Schema<IGroup> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  adminIds: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  memberIds: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  groupPicUrl: {
    type: String,
    default: "",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  canSendMessages: {
    type: Boolean,
    default: true, // By default, all members can send messages
  },
}, {
  timestamps: true, 
});

// Indexing for faster query performance
GroupSchema.index({ name: 1 });

const Group = mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);
export default Group;
