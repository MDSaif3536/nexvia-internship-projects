import { Router } from "express";
import { User } from "../models/User.js";
import { auth, signToken } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required" });
  if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
  const allowed = ["student", "instructor"];
  const chosen = allowed.includes(role) ? role : "student";
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "An account with this email already exists" });
  const user = await User.create({ name, email, password, role: chosen });
  res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || "").toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password || ""))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  res.json({ token: signToken(user), user: user.toSafeJSON() });
});

authRouter.get("/me", auth, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});
