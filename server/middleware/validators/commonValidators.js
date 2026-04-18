const Joi = require("joi");

// ─── Reusable field definitions ───────────────────────────
const mongoId = Joi.string()
  .pattern(/^[a-f\d]{24}$/i)
  .required()
  .messages({
    "string.pattern.base": "Invalid ID format",
    "any.required":        "ID is required",
  });

const paginationSchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// ─── Validate MongoDB ObjectId param ─────────────────────
const validateMongoId = (paramName = "id") => (req, res, next) => {
  const id = req.params[paramName];
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return res.status(400).json({ message: `Invalid ${paramName} format` });
  }
  next();
};

module.exports = { mongoId, paginationSchema, validateMongoId };