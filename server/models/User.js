const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Name is required"],
      trim:     true,
    },
    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:     String,
      required: [true, "Password is required"],
      minlength: 6,
      select:   false, // Never return password in queries
    },
    role: {
      type:    String,
      enum:    ["user", "owner", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      default: "",
    },
    isVerified: {
      type:    Boolean,
      default: false,
    },
    isSuspended: {
      type:    Boolean,
      default: false,
    },
    // Password reset (set when user requests forgot-password)
    resetPasswordToken:   { type: String, default: undefined },
    resetPasswordExpire:  { type: Date,   default: undefined },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);