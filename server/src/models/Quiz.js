import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true }
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true, unique: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    passingScore: { type: Number, default: 70 },
    questions: [questionSchema]
  },
  { timestamps: true }
);

export const Quiz = mongoose.model("Quiz", quizSchema);
