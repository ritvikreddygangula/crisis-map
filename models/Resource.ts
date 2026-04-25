import mongoose, { Schema, Model } from "mongoose";
import type { Resource } from "@/types";

const ResourceSchema = new Schema<Resource>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    address: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ["open", "limited", "closed", "unknown"],
      default: "unknown",
    },
    services: [
      {
        type: String,
        enum: ["power", "wifi", "water", "shelter", "medical", "cooling", "food"],
      },
    ],
    capacity: { type: Number, default: null },
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    lastUpdated: { type: String, required: true },
    notes: { type: String, default: "" },
    distanceMiles: { type: Number },
    recommendationScore: { type: Number },
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

export const ResourceModel: Model<Resource> =
  (mongoose.models.Resource as Model<Resource>) ||
  mongoose.model<Resource>("Resource", ResourceSchema);
