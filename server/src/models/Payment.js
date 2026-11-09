import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    platformFee: { type: Number, required: true },
    instructorPayout: { type: Number, required: true },
    stripeSessionId: String,
    stripePaymentIntent: String,
    status: { type: String, enum: ["test_paid", "pending", "failed"], default: "test_paid" },
    mode: { type: String, default: "test" }
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
