const express = require("express");
const router  = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validate                    = require("../middleware/validate");
const { createBookingSchema, updateStatusSchema } = require("../middleware/validators/bookingValidator");
const {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getBookingById,
  updateBookingStatus,
  getAllBookings,
} = require("../controllers/bookingController");

// ── User ──────────────────────────────────────────────────
// POST   /api/bookings            — create booking request
router.post(
  "/",
  protect,
  authorizeRoles("user"),
  validate(createBookingSchema),
  createBooking
);

// GET    /api/bookings/my         — user's own bookings
router.get(
  "/my",
  protect,
  authorizeRoles("user"),
  getMyBookings
);

// ── Owner ─────────────────────────────────────────────────
// GET    /api/bookings/owner      — all bookings for owner's lawns
router.get(
  "/owner",
  protect,
  authorizeRoles("owner"),
  getOwnerBookings
);

// ── Admin ─────────────────────────────────────────────────
// GET    /api/bookings/admin/all  — all bookings platform-wide
router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllBookings
);

// ── Shared ────────────────────────────────────────────────
// GET    /api/bookings/:id        — single booking (user/owner/admin)
router.get("/:id", protect, getBookingById);

// PUT    /api/bookings/:id/status — update status (owner confirms/cancels, user cancels)
router.put(
  "/:id/status",
  protect,
  validate(updateStatusSchema),
  updateBookingStatus
);

module.exports = router;