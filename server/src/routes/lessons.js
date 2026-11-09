import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";
import { Lesson } from "../models/Lesson.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Quiz } from "../models/Quiz.js";
import { auth, requireRoles } from "../middleware/auth.js";
import { config, mediaUrl } from "../config.js";
import { getTranscodeQueue, isRedisReady } from "../jobs/queue.js";
import { transcodeLesson, markFailed } from "../services/transcode.js";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(config.uploadDir, String(req.params.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, `${uuid()}${path.extname(file.originalname || ".mp4")}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("video/")) return cb(new Error("Only video files are allowed"));
    cb(null, true);
  }
});

export const lessonsRouter = Router();

async function canTeach(req, lesson) {
  const course = await Course.findById(lesson.course);
  return req.user.role === "admin" || String(course.instructor) === String(req.user._id);
}

lessonsRouter.get("/:id", auth, async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  const course = await Course.findById(lesson.course);
  const enrolled =
    req.user.role === "admin" ||
    String(course.instructor) === String(req.user._id) ||
    (await Enrollment.exists({ student: req.user._id, course: course._id, status: "active" }));
  if (!enrolled) return res.status(403).json({ message: "Enroll in this course to view lessons" });

  const quiz = lesson.type === "quiz" ? await Quiz.findOne({ lesson: lesson._id }).select("-questions.correctIndex") : null;
  const payload = lesson.toObject();
  payload.playbackUrl = payload.video?.hlsKey ? mediaUrl(path.relative(config.uploadDir, payload.video.hlsKey).replaceAll("\\", "/")) : "";
  payload.originalUrl = payload.video?.originalKey
    ? mediaUrl(path.relative(config.uploadDir, payload.video.originalKey).replaceAll("\\", "/"))
    : "";
  res.json({ lesson: payload, quiz, course });
});

lessonsRouter.post("/:id/video", auth, requireRoles("instructor", "admin"), upload.single("video"), async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  if (!(await canTeach(req, lesson))) return res.status(403).json({ message: "Not your lesson" });
  if (!req.file) return res.status(400).json({ message: "Video file required" });

  lesson.type = "video";
  lesson.video = {
    originalKey: req.file.path,
    status: "queued",
    hlsKey: "",
    durationSec: 0
  };
  await lesson.save();

  if (isRedisReady()) {
    await getTranscodeQueue().add("transcode", { lessonId: String(lesson._id) }, { removeOnComplete: true });
  } else {
    transcodeLesson(lesson._id).catch((err) => markFailed(lesson._id, err.message));
  }

  res.json({ lesson, queued: isRedisReady() });
});
