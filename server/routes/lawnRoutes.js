const express = require("express");
const router  = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getAllLawns, getLawnById, createLawn, updateLawn, deleteLawn, getMyLawns,
} = require("../controllers/lawnController");

router.get("/",                   getAllLawns);
router.get("/owner/my-lawns",     protect, authorizeRoles("owner"), getMyLawns);
router.get("/:id",                getLawnById);
router.post("/",                  protect, authorizeRoles("owner"), createLawn);
router.put("/:id",                protect, authorizeRoles("owner"), updateLawn);
router.delete("/:id",             protect, authorizeRoles("owner", "admin"), deleteLawn);

module.exports = router;
