import { Router } from "express";
import { v4 as uuid } from "uuid";
import { LiveSession } from "../models/LiveSession.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { auth, requireRoles } from "../middleware/auth.js";

export const liveRouter = Router();

liveRouter.post("/", auth, requireRoles("instructor", "admin"), async (req, res) => {
  const { courseId, title, scheduledAt } = req.body;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });
  if (req.user.role !== "admin" && String(course.instructor) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not your course" });
  }
  const session = await LiveSession.create({
    course: course._id,
    instructor: req.user._id,
    title: title || "Live class",
    roomId: uuid(),
    scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date()
  });
  res.status(201).json({ session });
});

liveRouter.get("/", auth, async (req, res) => {
  const filter = {};
  if (req.query.courseId) filter.course = req.query.courseId;
  const sessions = await LiveSession.find(filter).populate("course", "title slug").sort("-scheduledAt");
  res.json({ sessions });
});

liveRouter.post("/:id/start", auth, requireRoles("instructor", "admin"), async (req, res) => {
  const session = await LiveSession.findById(req.params.id);
  if (!session) return res.status(404).json({ message: "Session not found" });
  session.status = "live";
  await session.save();
  res.json({ session });
});

liveRouter.post("/:id/end", auth, requireRoles("instructor", "admin"), async (req, res) => {
  const session = await LiveSession.findById(req.params.id);
  if (!session) return res.status(404).json({ message: "Session not found" });
  session.status = "ended";
  await session.save();
  res.json({ session });
});

liveRouter.get("/:id", auth, async (req, res) => {
  const session = await LiveSession.findById(req.params.id).populate("course instructor", "title slug name");
  if (!session) return res.status(404).json({ message: "Session not found" });
  const allowed =
    req.user.role === "admin" ||
    String(session.instructor._id) === String(req.user._id) ||
    (await Enrollment.exists({ student: req.user._id, course: session.course._id, status: "active" }));
  if (!allowed) return res.status(403).json({ message: "Enroll in the course to join live class" });
  res.json({ session });
});
