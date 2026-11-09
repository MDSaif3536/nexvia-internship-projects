import { Router } from "express";
import { auth, requireRoles } from "../middleware/auth.js";
import { instructorRevenue } from "../services/payments.js";
import { Payment } from "../models/Payment.js";
import { config } from "../config.js";

export const paymentsRouter = Router();

paymentsRouter.get("/config", (req, res) => {
  res.json({
    publishableKey: config.stripePublishable.includes("placeholder") ? "" : config.stripePublishable,
    testMode: true,
    platformFee: config.platformFee
  });
});

paymentsRouter.get("/instructor", auth, requireRoles("instructor", "admin"), async (req, res) => {
  const stats = await instructorRevenue(req.user._id);
  res.json(stats);
});

paymentsRouter.get("/admin", auth, requireRoles("admin"), async (req, res) => {
  const payments = await Payment.find().populate("student instructor course", "name email title").sort("-createdAt");
  res.json({ payments });
});
