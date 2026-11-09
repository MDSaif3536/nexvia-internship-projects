import { Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "../config.js";

let connection;
let transcodeQueue;
let redisReady = false;

export function getRedis() {
  if (!connection) {
    connection = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true
    });
    connection.on("error", () => {
      redisReady = false;
    });
    connection.on("connect", () => {
      redisReady = true;
    });
  }
  return connection;
}

export function getTranscodeQueue() {
  if (!transcodeQueue) {
    transcodeQueue = new Queue("video-transcode", { connection: getRedis() });
  }
  return transcodeQueue;
}

export async function tryConnectRedis() {
  try {
    await getRedis().connect();
    redisReady = true;
    return true;
  } catch {
    redisReady = false;
    return false;
  }
}

export function isRedisReady() {
  return redisReady;
}
