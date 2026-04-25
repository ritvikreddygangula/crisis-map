import mongoose, { Schema, Model } from "mongoose";
import type { Report } from "@/types";

const ReportSchema = new Schema<Report>(
  {
    id: { type: String, required: true, unique: true, index: true },
    resourceId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    statusReported: {
      type: String,
      enum: ["open", "limited", "closed", "unknown"],
      required: true,
    },
    servicesAvailable: [
      {
        type: String,
        enum: ["power", "wifi", "water", "shelter", "medical", "cooling", "food"],
      },
    ],
    crowdLevel: {
      type: String,
      enum: ["empty", "moderate", "crowded"],
      required: true,
    },
    note: { type: String, default: "" },
    createdAt: { type: String, required: true },
  },
  {
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>)._id;
        return ret;
      },
    },
  }
);

export const ReportModel: Model<Report> =
  (mongoose.models.Report as Model<Report>) ||
  mongoose.model<Report>("Report", ReportSchema);
