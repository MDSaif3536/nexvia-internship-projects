import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

export const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lumina",
  jwtSecret: process.env.JWT_SECRET || "lumina-dev-secret",
  redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  cdnBaseUrl: process.env.CDN_BASE_URL || "http://localhost:5000/cdn",
  cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN || "",
  stripeSecret: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripePublishable: process.env.STRIPE_PUBLISHABLE_KEY || "",
  platformFee: Number(process.env.PLATFORM_FEE_PERCENT || 15),
  uploadDir: path.resolve(__dirname, "..", process.env.UPLOAD_DIR || "uploads"),
  certDir: path.resolve(__dirname, "..", process.env.CERT_DIR || "certificates")
};

export function mediaUrl(relativePath) {
  if (!relativePath) return "";
  const key = String(relativePath).replace(/^\/+/, "");
  if (config.cloudfrontDomain) {
    return `https://${config.cloudfrontDomain.replace(/^https?:\/\//, "")}/${key}`;
  }
  return `${config.cdnBaseUrl}/${key}`;
}
