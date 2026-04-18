const express = require("express");
const router  = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validate                    = require("../middleware/validate");
const { lawnSchema, lawnUpdateSchema } = require("../middleware/validators/lawnValidator");
const {
  getAllLawns,
  getLawnById,
  createLawn,
  updateLawn,
  deleteLawn,
  getMyLawns,
  getPendingLawns,
  approveLawn,
} = require("../controllers/lawnController");

// ── Public ────────────────────────────────────────────────
router.get("/",    getAllLawns);
router.get("/:id", getLawnById);

// ── Owner ─────────────────────────────────────────────────
router.get(
  "/owner/my-lawns",
  protect,
  authorizeRoles("owner"),
  getMyLawns
);
router.post(
  "/",
  protect,
  authorizeRoles("owner"),
  validate(lawnSchema),
  createLawn
);
router.put(
  "/:id",
  protect,
  authorizeRoles("owner"),
  validate(lawnUpdateSchema),
  updateLawn
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("owner", "admin"),
  deleteLawn
);

// ── Admin ─────────────────────────────────────────────────
router.get(
  "/admin/pending",
  protect,
  authorizeRoles("admin"),
  getPendingLawns
);
router.put(
  "/admin/:id/approve",
  protect,
  authorizeRoles("admin"),
  approveLawn
);

module.exports = router;