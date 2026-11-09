import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["student", "instructor", "admin"], default: "student" },
    bio: { type: String, default: "" },
    headline: { type: String, default: "" },
    avatarColor: { type: String, default: "#c45c26" }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hash(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    bio: this.bio,
    headline: this.headline,
    avatarColor: this.avatarColor,
    createdAt: this.createdAt
  };
};

export const User = mongoose.model("User", userSchema);
