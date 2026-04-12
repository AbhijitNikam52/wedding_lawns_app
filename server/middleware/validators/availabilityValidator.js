const Joi = require("joi");

// ─── Mark dates available ─────────────────────────────────
const markDatesSchema = Joi.object({
  dates: Joi.array()
    .items(Joi.date().iso().required())
    .min(1)
    .required()
    .messages({
      "array.min":  "At least one date is required",
      "any.required": "dates array is required",
    }),
});

// ─── Block / unblock a single date ───────────────────────
const blockDateSchema = Joi.object({
  date: Joi.date().iso().required().messages({
    "any.required": "date is required",
    "date.base":    "date must be a valid ISO date",
  }),
  isBlocked: Joi.boolean().required().messages({
    "any.required": "isBlocked (true/false) is required",
  }),
});

module.exports = { markDatesSchema, blockDateSchema };