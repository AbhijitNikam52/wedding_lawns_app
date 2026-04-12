const express = require("express");
const router  = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload                      = require("../middleware/multer");
const {
  uploadLawnPhotos,
  deleteLawnPhoto,
  reorderPhotos,
} = require("../controllers/uploadController");

// POST   /api/upload/lawn-photos/:lawnId  — upload up to 10 images
router.post(
  "/lawn-photos/:lawnId",
  protect,
  authorizeRoles("owner"),
  upload.array("photos", 10),   // field name must be "photos" in form-data
  uploadLawnPhotos
);

// DELETE /api/upload/lawn-photos/:lawnId  — delete one photo by URL
router.delete(
  "/lawn-photos/:lawnId",
  protect,
  authorizeRoles("owner"),
  deleteLawnPhoto
);

// PUT    /api/upload/lawn-photos/:lawnId/reorder — save new photo order
router.put(
  "/lawn-photos/:lawnId/reorder",
  protect,
  authorizeRoles("owner"),
  reorderPhotos
);

module.exports = router;