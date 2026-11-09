import { Router } from "express";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Payment } from "../models/Payment.js";
import { auth, requireRoles } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(auth, requireRoles("admin"));

adminRouter.get("/overview", async (_req, res) => {
  const [users, courses, enrollments, payments, byRole] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Enrollment.countDocuments({ status: "active" }),
    Payment.aggregate([{ $group: { _id: null, gross: { $sum: "$amount" } } }]),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])
  ]);
  res.json({
    users,
    courses,
    enrollments,
    gross: payments[0]?.gross || 0,
    byRole
  });
});

adminRouter.get("/users", async (_req, res) => {
  const users = await User.find().sort("-createdAt");
  res.json({ users: users.map((u) => u.toSafeJSON()) });
});

adminRouter.patch("/users/:id/role", async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  res.json({ user: user.toSafeJSON() });
});
