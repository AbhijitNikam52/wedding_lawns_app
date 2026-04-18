// Global error handler — attach to the bottom of server.js
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Internal Server Error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 404;
    message    = "Resource not found";
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message    = `${field} already exists`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message    = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message    = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message    = "Token expired, please login again";
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message    = "File too large. Maximum size is 5 MB.";
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    statusCode = 400;
    message    = "Too many files. Maximum is 10 photos.";
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message    = "Unexpected field name. Use 'photos' as the field name.";
  }

  // CORS error
  if (err.message?.startsWith("CORS:")) {
    statusCode = 403;
    message    = "Not allowed by CORS policy";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;