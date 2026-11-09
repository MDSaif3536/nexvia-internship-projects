import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { config } from "../config.js";
import { Certificate } from "../models/Certificate.js";
import { Enrollment } from "../models/Enrollment.js";
import { randomUUID } from "crypto";

export async function issueCertificate({ student, course, enrollment }) {
  await fs.promises.mkdir(config.certDir, { recursive: true });
  const serial = `LUM-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const fileName = `${serial}.pdf`;
  const filePath = path.join(config.certDir, fileName);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 48 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#1c1915");
    doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56).stroke("#d7a15c");
    doc.fillColor("#f4efe6").fontSize(12).text("LUMINA SCHOOL", 48, 56, { align: "center" });
    doc.moveDown(1.4);
    doc.fontSize(36).fillColor("#f4efe6").text("Certificate of Completion", { align: "center" });
    doc.moveDown(0.8);
    doc.fontSize(14).fillColor("#c8bfb0").text("This is to certify that", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(28).fillColor("#d7a15c").text(student.name, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor("#c8bfb0").text("has successfully completed the course", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(22).fillColor("#f4efe6").text(course.title, { align: "center" });
    doc.moveDown(1.6);
    doc.fontSize(11).fillColor("#9a9186").text(`Serial ${serial}`, { align: "center" });
    doc.text(new Date().toLocaleDateString("en-IN", { dateStyle: "long" }), { align: "center" });
    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  const cert = await Certificate.create({
    serial,
    student: student._id,
    course: course._id,
    enrollment: enrollment._id,
    fileKey: filePath
  });

  enrollment.certificateId = cert._id;
  enrollment.completedAt = enrollment.completedAt || new Date();
  await enrollment.save();
  return cert;
}

export async function ensureCertificate(enrollment) {
  if (enrollment.certificateId) {
    return Certificate.findById(enrollment.certificateId);
  }
  await enrollment.populate("student course");
  return issueCertificate({
    student: enrollment.student,
    course: enrollment.course,
    enrollment
  });
}
