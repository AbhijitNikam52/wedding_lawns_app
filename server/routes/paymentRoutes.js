const express = require("express");
const router  = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validate                    = require("../middleware/validate");
const { createOrderSchema, verifyPaymentSchema } = require("../middleware/validators/paymentValidator");
const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentById,
  handleWebhook,
} = require("../controllers/paymentController");

// Webhook — public, no auth (Razorpay calls this)
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

// Protected routes
router.use(protect);

// POST /api/payment/create-order — user creates Razorpay order
router.post(
  "/create-order",
  authorizeRoles("user"),
  validate(createOrderSchema),
  createOrder
);

// POST /api/payment/verify — user verifies payment after checkout
router.post(
  "/verify",
  authorizeRoles("user"),
  validate(verifyPaymentSchema),
  verifyPayment
);

// GET  /api/payment/history — payment history (user/owner/admin)
router.get("/history", getPaymentHistory);

// GET  /api/payment/:paymentId — single payment detail
router.get("/:paymentId", getPaymentById);

module.exports = router;