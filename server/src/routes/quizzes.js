import { Router } from "express";
import { Quiz } from "../models/Quiz.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { Lesson } from "../models/Lesson.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { auth, requireRoles } from "../middleware/auth.js";
import { gradeQuiz } from "../utils/grade.js";

export const quizzesRouter = Router();

quizzesRouter.post("/", auth, requireRoles("instructor", "admin"), async (req, res) => {
  const { lessonId, title, passingScore, questions } = req.body;
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  const course = await Course.findById(lesson.course);
  if (req.user.role !== "admin" && String(course.instructor) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not your course" });
  }
  lesson.type = "quiz";
  await lesson.save();
  const quiz = await Quiz.findOneAndUpdate(
    { lesson: lesson._id },
    { lesson: lesson._id, course: course._id, title: title || lesson.title, passingScore: passingScore ?? 70, questions },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ quiz });
});

quizzesRouter.post("/:id/attempt", auth, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  const enrolled = await Enrollment.exists({ student: req.user._id, course: quiz.course, status: "active" });
  const course = await Course.findById(quiz.course);
  const isStaff = req.user.role === "admin" || String(course.instructor) === String(req.user._id);
  if (!enrolled && !isStaff) return res.status(403).json({ message: "Enroll first" });

  const result = gradeQuiz(quiz, req.body.answers || []);
  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    student: req.user._id,
    lesson: quiz.lesson,
    answers: req.body.answers || [],
    score: result.score,
    passed: result.passed
  });
  res.json({ attempt, result });
});
