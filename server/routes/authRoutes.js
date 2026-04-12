const express = require("express");
const router  = express.Router();

const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const validate    = require("../middleware/validate");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../middleware/validators/authValidator");

// Public routes
router.post("/register",        validate(registerSchema),       register);
router.post("/login",           validate(loginSchema),          login);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password",  validate(resetPasswordSchema),  resetPassword);

// Protected routes
router.get ("/me",              protect, getMe);
router.put ("/update-profile",  protect, updateProfile);
router.put ("/change-password", protect, changePassword);

module.exports = router;