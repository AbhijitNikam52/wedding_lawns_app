const Joi = require("joi");

// ─── Register ─────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).max(32).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 32 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid("user", "owner").default("user"),
  phone: Joi.string().allow("").optional(),
});

// ─── Login ────────────────────────────────────────────────
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// ─── Forgot Password ──────────────────────────────────────
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
});

// ─── Reset Password ───────────────────────────────────────
const resetPasswordSchema = Joi.object({
  token:    Joi.string().required().messages({ "any.required": "Reset token is required" }),
  password: Joi.string().min(6).max(32).required().messages({
    "string.min": "New password must be at least 6 characters",
    "any.required": "New password is required",
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};