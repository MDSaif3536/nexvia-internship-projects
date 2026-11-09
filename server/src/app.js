import express from "express";
import cors from "cors";
import fs from "fs";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { coursesRouter } from "./routes/courses.js";
import { lessonsRouter } from "./routes/lessons.js";
import { enrollmentsRouter } from "./routes/enrollments.js";
import { quizzesRouter } from "./routes/quizzes.js";
import { liveRouter } from "./routes/live.js";
import { paymentsRouter } from "./routes/payments.js";
import { certificatesRouter } from "./routes/certificates.js";
import { adminRouter } from "./routes/admin.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(rateLimit({ windowMs: 60_000, max: 300 }));

  fs.mkdirSync(config.uploadDir, { recursive: true });
  fs.mkdirSync(config.certDir, { recursive: true });

  app.use(
    "/cdn",
    express.static(config.uploadDir, {
      setHeaders(res) {
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("X-CDN-Origin", config.cloudfrontDomain ? "cloudfront" : "lumina-edge");
      }
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "lumina-api",
      cdn: config.cloudfrontDomain || config.cdnBaseUrl
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/courses", coursesRouter);
  app.use("/api/lessons", lessonsRouter);
  app.use("/api/enrollments", enrollmentsRouter);
  app.use("/api/quizzes", quizzesRouter);
  app.use("/api/live", liveRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/certificates", certificatesRouter);
  app.use("/api/admin", adminRouter);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(400).json({ message: err.message || "Request failed" });
  });

  return app;
}
