/**
 * Sanitizes request body and query params to prevent NoSQL injection.
 * Removes keys starting with "$" or containing "." from user input.
 */
const sanitizeInput = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      sanitizeInput(obj[key]);
    }
  }
  return obj;
};

const sanitize = (req, res, next) => {
  if (req.body)   sanitizeInput(req.body);
  if (req.query)  sanitizeInput(req.query);
  if (req.params) sanitizeInput(req.params);
  next();
};

module.exports = sanitize;