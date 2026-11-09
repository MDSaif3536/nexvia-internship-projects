import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { config } from "./config.js";
import { createApp } from "./app.js";
import { attachSignaling } from "./live/signaling.js";
import { tryConnectRedis } from "./jobs/queue.js";

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: config.clientUrl } });
attachSignaling(io);

await mongoose.connect(config.mongoUri);
const redis = await tryConnectRedis();

server.listen(config.port, () => {
  console.log(`Lumina API on http://localhost:${config.port}`);
  console.log(`Mongo connected. Redis ${redis ? "ready (BullMQ)" : "offline — inline transcode fallback"}`);
});
