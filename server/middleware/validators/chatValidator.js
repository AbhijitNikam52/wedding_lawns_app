const Joi = require("joi");

// ─── Send message ─────────────────────────────────────────
const sendMessageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required().messages({
    "string.min":   "Message cannot be empty",
    "string.max":   "Message cannot exceed 1000 characters",
    "any.required": "message is required",
  }),
  receiverId: Joi.string().required().messages({
    "any.required": "receiverId is required",
  }),
});

module.exports = { sendMessageSchema };