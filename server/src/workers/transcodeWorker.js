import { Worker } from "bullmq";
import mongoose from "mongoose";
import { config } from "../config.js";
import { getRedis } from "../jobs/queue.js";
import { transcodeLesson, markFailed } from "../services/transcode.js";

await mongoose.connect(config.mongoUri);

const worker = new Worker(
  "video-transcode",
  async (job) => {
    await transcodeLesson(job.data.lessonId);
  },
  { connection: getRedis(), concurrency: 1 }
);

worker.on("failed", async (job, err) => {
  if (job?.data?.lessonId) await markFailed(job.data.lessonId, err.message);
  console.error("Transcode failed", err.message);
});

console.log("Lumina transcode worker listening");
