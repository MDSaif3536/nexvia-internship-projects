import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { Lesson } from "../models/Lesson.js";

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `${cmd} exited ${code}`));
    });
  });
}

async function ffmpegAvailable() {
  try {
    await run("ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

export async function transcodeLesson(lessonId) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson?.video?.originalKey) throw new Error("Lesson has no uploaded video");

  lesson.video.status = "processing";
  await lesson.save();

  const original = lesson.video.originalKey;
  const dir = path.dirname(original);
  const hlsDir = path.join(dir, "hls");
  await fs.mkdir(hlsDir, { recursive: true });
  const playlist = path.join(hlsDir, "index.m3u8");

  const hasFfmpeg = await ffmpegAvailable();
  if (hasFfmpeg) {
    await run("ffmpeg", [
      "-y",
      "-i",
      original,
      "-codec:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-codec:a",
      "aac",
      "-b:a",
      "128k",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      path.join(hlsDir, "seg_%03d.ts"),
      playlist
    ]);
    lesson.video.hlsKey = playlist;
  } else {
    lesson.video.hlsKey = original;
    lesson.video.error = "FFmpeg not found; serving original file for local demo";
  }

  lesson.video.status = "ready";
  await lesson.save();
  return lesson;
}

export async function markFailed(lessonId, error) {
  await Lesson.findByIdAndUpdate(lessonId, {
    "video.status": "failed",
    "video.error": error
  });
}
