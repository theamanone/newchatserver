import mongoose, { Document, Schema } from "mongoose";

export interface IAppAdmin extends Document {
  userId: string; // Format: "appname+phonenumber"
  applicationId: mongoose.Types.ObjectId;
  role: "admin" | "superadmin";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppAdminSchema: Schema<IAppAdmin> = new Schema(
  {
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
    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique admin per application
AppAdminSchema.index({ userId: 1, applicationId: 1 }, { unique: true });

export default mongoose.models.AppAdmin || mongoose.model<IAppAdmin>("AppAdmin", AppAdminSchema);
