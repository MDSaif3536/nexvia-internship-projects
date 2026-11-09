import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    serial: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment", required: true },
    fileKey: { type: String, required: true }
  },
  { timestamps: true }
);

export const Certificate = mongoose.model("Certificate", certificateSchema);
