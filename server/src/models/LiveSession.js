import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    roomId: { type: String, required: true, unique: true },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ["scheduled", "live", "ended"], default: "scheduled" }
  },
  { timestamps: true }
);

export const LiveSession = mongoose.model("LiveSession", liveSessionSchema);
