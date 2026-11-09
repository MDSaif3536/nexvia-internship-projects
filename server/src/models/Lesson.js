import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    type: { type: String, enum: ["video", "quiz", "article"], default: "video" },
    article: { type: String, default: "" },
    video: {
      originalKey: String,
      hlsKey: String,
      posterKey: String,
      status: {
        type: String,
        enum: ["none", "uploaded", "queued", "processing", "ready", "failed"],
        default: "none"
      },
      durationSec: { type: Number, default: 0 },
      error: String
    }
  },
  { timestamps: true }
);

export const Lesson = mongoose.model("Lesson", lessonSchema);
