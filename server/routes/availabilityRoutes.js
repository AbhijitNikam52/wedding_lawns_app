const express = require("express");
const router  = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validate                    = require("../middleware/validate");
const { markDatesSchema, blockDateSchema } = require("../middleware/validators/availabilityValidator");
const {
  getLawnAvailability,
  markDatesAvailable,
  toggleBlockDate,
  removeDatesAvailable,
  checkDateAvailability,
  getOwnerAvailability,
} = require("../controllers/availabilityController");

// ── Public ────────────────────────────────────────────────
// GET  /api/availability/:lawnId          → full map (with optional ?month=)
router.get("/:lawnId", getLawnAvailability);

// GET  /api/availability/:lawnId/check?date=2024-06-15
router.get("/:lawnId/check", checkDateAvailability);

// ── Owner ─────────────────────────────────────────────────
// GET  /api/availability/:lawnId/owner    → full map including blocked/booked
router.get(
  "/:lawnId/owner",
  protect,
  authorizeRoles("owner"),
  getOwnerAvailability
);

// POST /api/availability/:lawnId/mark     → mark array of dates as available
router.post(
  "/:lawnId/mark",
  protect,
  authorizeRoles("owner"),
  validate(markDatesSchema),
  markDatesAvailable
);

// PUT  /api/availability/:lawnId/block    → toggle block on single date
router.put(
  "/:lawnId/block",
  protect,
  authorizeRoles("owner"),
  validate(blockDateSchema),
  toggleBlockDate
);

// DELETE /api/availability/:lawnId/mark  → remove dates from available
router.delete(
  "/:lawnId/mark",
  protect,
  authorizeRoles("owner"),
  validate(markDatesSchema),
  removeDatesAvailable
);

module.exports = router;