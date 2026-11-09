import { Router } from "express";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { Enrollment } from "../models/Enrollment.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { auth, requireRoles } from "../middleware/auth.js";
import { progressPercent } from "../utils/grade.js";
import { createCheckout } from "../services/payments.js";
import { ensureCertificate } from "../services/certificate.js";

export const enrollmentsRouter = Router();

enrollmentsRouter.get("/me", auth, async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id }).populate({
    path: "course",
    populate: { path: "instructor", select: "name" }
  });
  res.json({ enrollments });
});

enrollmentsRouter.post("/:courseId", auth, requireRoles("student", "admin"), async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || !course.published) return res.status(404).json({ message: "Course not available" });

  const existing = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (existing?.status === "active") return res.json({ enrollment: existing, already: true });

  if (course.price > 0) {
    const checkout = await createCheckout({ student: req.user, course });
    return res.json({ checkout });
  }

  const enrollment = await Enrollment.findOneAndUpdate(
    { student: req.user._id, course: course._id },
    { status: "active" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (!existing) await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } });
  res.status(201).json({ enrollment });
});

enrollmentsRouter.post("/:courseId/lessons/:lessonId/complete", auth, async (req, res) => {
  const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId, status: "active" });
  if (!enrollment) return res.status(403).json({ message: "You are not enrolled" });
  const lesson = await Lesson.findOne({ _id: req.params.lessonId, course: req.params.courseId });
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  if (lesson.type === "quiz") {
    const passed = await QuizAttempt.findOne({ student: req.user._id, lesson: lesson._id, passed: true });
    if (!passed) return res.status(400).json({ message: "Pass the quiz before marking this lesson complete" });
  }

  const id = String(lesson._id);
  if (!enrollment.completedLessonIds.some((x) => String(x) === id)) {
    enrollment.completedLessonIds.push(lesson._id);
  }
  const total = await Lesson.countDocuments({ course: enrollment.course });
  enrollment.progressPercent = progressPercent(enrollment.completedLessonIds.length, total);
  if (enrollment.progressPercent === 100 && !enrollment.certificateId) {
    await ensureCertificate(enrollment);
  }
  await enrollment.save();
  await enrollment.populate("certificateId");
  res.json({ enrollment });
});
