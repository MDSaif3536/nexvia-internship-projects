import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    subtitle: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    price: { type: Number, default: 0 },
    thumbnail: { type: String, default: "" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    published: { type: Boolean, default: false },
    learningOutcomes: [{ type: String }],
    enrolledCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
