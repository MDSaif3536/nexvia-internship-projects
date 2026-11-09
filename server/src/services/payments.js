import Stripe from "stripe";
import { config } from "../config.js";
import { Payment } from "../models/Payment.js";
import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";

function stripeClient() {
  if (!config.stripeSecret || config.stripeSecret.includes("placeholder")) return null;
  return new Stripe(config.stripeSecret);
}

export function splitAmount(amount) {
  const platformFee = Math.round(amount * (config.platformFee / 100) * 100) / 100;
  const instructorPayout = Math.round((amount - platformFee) * 100) / 100;
  return { platformFee, instructorPayout };
}

export async function createCheckout({ student, course }) {
  const { platformFee, instructorPayout } = splitAmount(course.price);
  const stripe = stripeClient();

  if (!stripe) {
    const payment = await Payment.create({
      student: student._id,
      instructor: course.instructor,
      course: course._id,
      amount: course.price,
      platformFee,
      instructorPayout,
      status: "test_paid",
      mode: "test_local"
    });
    await Enrollment.findOneAndUpdate(
      { student: student._id, course: course._id },
      { status: "active" },
      { upsert: true, setDefaultsOnInsert: true }
    );
    await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } });
    return { mode: "test_local", paymentId: payment._id, activated: true };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${config.clientUrl}/learn/${course.slug}?paid=1`,
    cancel_url: `${config.clientUrl}/courses/${course.slug}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(course.price * 100),
          product_data: { name: course.title }
        }
      }
    ],
    metadata: {
      studentId: String(student._id),
      courseId: String(course._id)
    }
  });

  await Enrollment.findOneAndUpdate(
    { student: student._id, course: course._id },
    { status: "pending_payment" },
    { upsert: true, setDefaultsOnInsert: true }
  );

  return { mode: "stripe_test", url: session.url, sessionId: session.id };
}

export async function instructorRevenue(instructorId) {
  const payments = await Payment.find({ instructor: instructorId, status: "test_paid" }).populate(
    "course student",
    "title name email"
  );
  const gross = payments.reduce((s, p) => s + p.amount, 0);
  const fees = payments.reduce((s, p) => s + p.platformFee, 0);
  const net = payments.reduce((s, p) => s + p.instructorPayout, 0);
  return { gross, fees, net, count: payments.length, payments };
}
