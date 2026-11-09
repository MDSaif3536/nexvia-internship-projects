import { Router } from "express";
import fs from "fs";
import { Certificate } from "../models/Certificate.js";
import { auth } from "../middleware/auth.js";

export const certificatesRouter = Router();

certificatesRouter.get("/me", auth, async (req, res) => {
  const certs = await Certificate.find({ student: req.user._id }).populate("course", "title slug");
  res.json({ certificates: certs });
});

certificatesRouter.get("/:id/download", auth, async (req, res) => {
  const cert = await Certificate.findById(req.params.id);
  if (!cert) return res.status(404).json({ message: "Certificate not found" });
  const allowed = req.user.role === "admin" || String(cert.student) === String(req.user._id);
  if (!allowed) return res.status(403).json({ message: "Not your certificate" });
  if (!fs.existsSync(cert.fileKey)) return res.status(404).json({ message: "File missing" });
  res.download(cert.fileKey, `${cert.serial}.pdf`);
});
