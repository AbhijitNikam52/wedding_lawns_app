const Joi = require("joi");

// ─── Create booking ───────────────────────────────────────
const createBookingSchema = Joi.object({
  lawnId: Joi.string().required().messages({
    "any.required": "lawnId is required",
  }),
  eventDate: Joi.date().iso().greater("now").required().messages({
    "date.greater": "Event date must be in the future",
    "any.required": "eventDate is required",
  }),
  guestCount: Joi.number().integer().min(1).optional(),
  specialRequests: Joi.string().max(500).allow("").optional(),
});

// ─── Update booking status ────────────────────────────────
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("confirmed", "cancelled", "completed")
    .required()
    .messages({
      "any.only":     "status must be confirmed, cancelled, or completed",
      "any.required": "status is required",
    }),
  reason: Joi.string().max(300).allow("").optional(), // cancellation reason
});

module.exports = { createBookingSchema, updateStatusSchema };