const Joi = require("joi");

// ─── Create / Update Lawn ─────────────────────────────────
const lawnSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.min":  "Lawn name must be at least 3 characters",
    "string.max":  "Lawn name cannot exceed 100 characters",
    "any.required":"Lawn name is required",
  }),
  city: Joi.string().min(2).max(60).required().messages({
    "string.min":  "City must be at least 2 characters",
    "any.required":"City is required",
  }),
  address: Joi.string().min(5).max(300).required().messages({
    "any.required":"Address is required",
  }),
  capacity: Joi.number().integer().min(50).required().messages({
    "number.min":  "Capacity must be at least 50 guests",
    "any.required":"Capacity is required",
  }),
  pricePerDay: Joi.number().min(0).required().messages({
    "number.min":  "Price cannot be negative",
    "any.required":"Price per day is required",
  }),
  description: Joi.string().max(1000).allow("").optional(),
  amenities:   Joi.array().items(Joi.string()).optional(),
  // photos handled separately via upload route
});

// ─── Update (all fields optional) ────────────────────────
const lawnUpdateSchema = Joi.object({
  name:        Joi.string().min(3).max(100).optional(),
  city:        Joi.string().min(2).max(60).optional(),
  address:     Joi.string().min(5).max(300).optional(),
  capacity:    Joi.number().integer().min(50).optional(),
  pricePerDay: Joi.number().min(0).optional(),
  description: Joi.string().max(1000).allow("").optional(),
  amenities:   Joi.array().items(Joi.string()).optional(),
});

module.exports = { lawnSchema, lawnUpdateSchema };