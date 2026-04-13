const express = require("express");
const router  = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getStats,
  getAllUsers,
  updateUserRole,
  toggleSuspend,
  deleteUser,
} = require("../controllers/adminController");

// All admin routes — must be authenticated + admin role
router.use(protect, authorizeRoles("admin"));

// GET  /api/admin/stats              — platform overview stats
router.get("/stats", getStats);

// GET  /api/admin/users              — all users (with search + role filter)
router.get("/users", getAllUsers);

// PUT  /api/admin/users/:id/role     — change user role
router.put("/users/:id/role", updateUserRole);

// PUT  /api/admin/users/:id/suspend  — suspend / reactivate user
router.put("/users/:id/suspend", toggleSuspend);

// DELETE /api/admin/users/:id        — delete user account
router.delete("/users/:id", deleteUser);

module.exports = router;