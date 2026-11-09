import { Router } from "express";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { Enrollment } from "../models/Enrollment.js";
import { LiveSession } from "../models/LiveSession.js";
import { auth, requireRoles } from "../middleware/auth.js";
import { slugify } from "../utils/slug.js";
import { mediaUrl } from "../config.js";

export const coursesRouter = Router();

function decorateCourse(course) {
  const obj = course.toObject ? course.toObject() : course;
  obj.thumbnailUrl = mediaUrl(obj.thumbnail);
  return obj;
}

coursesRouter.get("/", async (req, res) => {
  const filter = { published: true };
  if (req.query.q) filter.title = { $regex: req.query.q, $options: "i" };
  const courses = await Course.find(filter).populate("instructor", "name headline").sort("-createdAt");
  res.json({ courses: courses.map(decorateCourse) });
});

coursesRouter.get("/mine", auth, requireRoles("instructor", "admin"), async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { instructor: req.user._id };
  const courses = await Course.find(filter).sort("-updatedAt");
  res.json({ courses: courses.map(decorateCourse) });
});

coursesRouter.get("/:slug", async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug }).populate("instructor", "name headline bio");
  if (!course) return res.status(404).json({ message: "Course not found" });
  const lessons = await Lesson.find({ course: course._id }).sort("order");
  const lives = await LiveSession.find({ course: course._id }).sort("scheduledAt");
  res.json({
    course: decorateCourse(course),
    lessons: lessons.map((l) => ({
      id: l._id,
      title: l.title,
      order: l.order,
      type: l.type,
      videoStatus: l.video?.status
    })),
    liveSessions: lives
  });
});

coursesRouter.post("/", auth, requireRoles("instructor", "admin"), async (req, res) => {
  const { title, subtitle, description, category, level, price, learningOutcomes } = req.body;
  if (!title) return res.status(400).json({ message: "Title is required" });
  let slug = slugify(title);
  const clash = await Course.findOne({ slug });
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;
  const course = await Course.create({
    title,
    slug,
    subtitle,
    description,
    category,
    level,
    price: Number(price || 0),
    learningOutcomes: learningOutcomes || [],
    instructor: req.user._id,
    published: false
  });
  res.status(201).json({ course: decorateCourse(course) });
});

coursesRouter.patch("/:id", auth, requireRoles("instructor", "admin"), async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  if (req.user.role !== "admin" && String(course.instructor) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not your course" });
  }
  const fields = ["title", "subtitle", "description", "category", "level", "price", "published", "learningOutcomes"];
  for (const f of fields) if (f in req.body) course[f] = req.body[f];
  await course.save();
  res.json({ course: decorateCourse(course) });
});

coursesRouter.post("/:id/lessons", auth, requireRoles("instructor", "admin"), async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  if (req.user.role !== "admin" && String(course.instructor) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not your course" });
  }
  const count = await Lesson.countDocuments({ course: course._id });
  const lesson = await Lesson.create({
    course: course._id,
    title: req.body.title || `Lesson ${count + 1}`,
    type: req.body.type || "video",
    article: req.body.article || "",
    order: req.body.order ?? count
  });
  res.status(201).json({ lesson });
});

coursesRouter.get("/:id/roster", auth, requireRoles("instructor", "admin"), async (req, res) => {
  const enrollments = await Enrollment.find({ course: req.params.id }).populate("student", "name email");
  res.json({ enrollments });
});
