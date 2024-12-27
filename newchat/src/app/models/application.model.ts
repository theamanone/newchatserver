import mongoose, { Document, Schema } from "mongoose";

export interface IApplication extends Document {
  name: string;
  settings: {
    [key: string]: any;
  };
  logo?: {
    url: string;
    publicId: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema<IApplication> = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
    logo: {
      url: String,
      publicId: String,
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

export default mongoose.models.Application || mongoose.model<IApplication>("Application", ApplicationSchema);
