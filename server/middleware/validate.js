/**
 * Validation middleware factory using Joi
 * Usage: router.post("/register", validate(registerSchema), controller)
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map((d) => d.message.replace(/"/g, ""));
    return res.status(400).json({ message: messages.join(", ") });
  }

  next();
};

module.exports = validate;