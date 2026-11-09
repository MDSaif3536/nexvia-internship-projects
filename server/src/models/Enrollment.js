import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    status: { type: String, enum: ["active", "pending_payment", "refunded"], default: "active" },
    completedLessonIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
    progressPercent: { type: Number, default: 0 },
    completedAt: Date,
    certificateId: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" }
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
