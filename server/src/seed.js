import mongoose from "mongoose";
import { config } from "./config.js";
import { User } from "./models/User.js";
import { Course } from "./models/Course.js";
import { Lesson } from "./models/Lesson.js";
import { Quiz } from "./models/Quiz.js";
import { Enrollment } from "./models/Enrollment.js";
import { LiveSession } from "./models/LiveSession.js";
import { Payment } from "./models/Payment.js";
import { splitAmount } from "./services/payments.js";

await mongoose.connect(config.mongoUri);
await Promise.all([
  User.deleteMany({}),
  Course.deleteMany({}),
  Lesson.deleteMany({}),
  Quiz.deleteMany({}),
  Enrollment.deleteMany({}),
  LiveSession.deleteMany({}),
  Payment.deleteMany({})
]);

const admin = await User.create({
  name: "Amina Rao",
  email: "admin@lumina.test",
  password: "Password123!",
  role: "admin",
  headline: "School director"
});
const instructor = await User.create({
  name: "Dr. Kabir Mehta",
  email: "instructor@lumina.test",
  password: "Password123!",
  role: "instructor",
  headline: "Systems & media instructor",
  bio: "Builds production video pipelines and live classrooms."
});
const student = await User.create({
  name: "MD Saifuddin",
  email: "student@lumina.test",
  password: "Password123!",
  role: "student",
  headline: "Full-stack intern"
});

const web = await Course.create({
  title: "Realtime Systems for Online Schools",
  slug: "realtime-systems-online-schools",
  subtitle: "Video delivery, live rooms, and progress you can trust.",
  description:
    "A studio course on how a modern LMS ships: HLS transcoding, CDN edges, WebRTC classrooms, auto-graded quizzes, and instructor payouts.",
  category: "Engineering",
  level: "intermediate",
  price: 49,
  published: true,
  instructor: instructor._id,
  enrolledCount: 1,
  learningOutcomes: [
    "Model roles, courses, lessons, and enrollments",
    "Queue FFmpeg transcodes with BullMQ",
    "Deliver VOD through a CloudFront-compatible CDN URL",
    "Run a WebRTC live class with chat"
  ]
});

const design = await Course.create({
  title: "Visual Storytelling for Instructors",
  slug: "visual-storytelling-instructors",
  subtitle: "Turn a lesson into a sequence students finish.",
  description: "Pacing, thumbnails, and assessment design for recorded courses.",
  category: "Teaching",
  level: "beginner",
  price: 0,
  published: true,
  instructor: instructor._id,
  learningOutcomes: ["Plan a five-lesson arc", "Write quizzes that measure transfer"]
});

const l1 = await Lesson.create({ course: web._id, title: "Why schools fail at video", order: 0, type: "article", article: "Start with latency, not cosmetics. Students abandon players that buffer." });
const l2 = await Lesson.create({ course: web._id, title: "HLS pipeline lab", order: 1, type: "video", video: { status: "none" } });
const l3 = await Lesson.create({ course: web._id, title: "Checkpoint: delivery", order: 2, type: "quiz" });
const l4 = await Lesson.create({ course: design._id, title: "Opening frames", order: 0, type: "article", article: "The first 12 seconds decide whether a student stays." });

await Quiz.create({
  lesson: l3._id,
  course: web._id,
  title: "Delivery checkpoint",
  passingScore: 70,
  questions: [
    {
      prompt: "Which job system should convert uploads to HLS without blocking the API?",
      options: ["A synchronous Express handler", "BullMQ + FFmpeg worker", "The React client", "MongoDB triggers"],
      correctIndex: 1
    },
    {
      prompt: "CloudFront sits in front of objects primarily to…",
      options: ["Replace MongoDB", "Transcode videos", "Cache and edge-deliver media", "Grade quizzes"],
      correctIndex: 2
    },
    {
      prompt: "WebRTC is the right tool when you need…",
      options: ["VOD playlists", "Low-latency two-way live media", "PDF certificates", "Stripe payouts"],
      correctIndex: 1
    }
  ]
});

await Enrollment.create({
  student: student._id,
  course: web._id,
  status: "active",
  completedLessonIds: [l1._id],
  progressPercent: 33
});

const { platformFee, instructorPayout } = splitAmount(49);
await Payment.create({
  student: student._id,
  instructor: instructor._id,
  course: web._id,
  amount: 49,
  platformFee,
  instructorPayout,
  status: "test_paid",
  mode: "test_local"
});

await LiveSession.create({
  course: web._id,
  instructor: instructor._id,
  title: "Office hours: HLS + live rooms",
  roomId: "demo-room-lumina",
  scheduledAt: new Date(),
  status: "scheduled"
});

console.log("Seeded Lumina school");
console.log("Admin      admin@lumina.test / Password123!");
console.log("Instructor instructor@lumina.test / Password123!");
console.log("Student    student@lumina.test / Password123!");
await mongoose.disconnect();
