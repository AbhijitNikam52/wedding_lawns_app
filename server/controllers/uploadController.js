const cloudinary = require("../config/cloudinary");
const Lawn       = require("../models/Lawn");
const streamifier = require("streamifier");

// Helper: upload a buffer to Cloudinary via stream
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1200, height: 800, crop: "limit" }, // resize large images
          { quality: "auto", fetch_format: "auto" },   // auto compress
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ─── @route  POST /api/upload/lawn-photos/:lawnId ────────
// ─── @access Owner only (must own the lawn)
const uploadLawnPhotos = async (req, res, next) => {
  try {
    const lawn = await Lawn.findById(req.params.lawnId);

    if (!lawn) {
      return res.status(404).json({ message: "Lawn not found" });
    }

    // Only the owner of this lawn can upload photos
    if (lawn.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Please select at least one image" });
    }

    // Max 10 photos total per lawn
    const currentCount = lawn.photos.length;
    const incoming     = req.files.length;
    if (currentCount + incoming > 10) {
      return res.status(400).json({
        message: `Cannot upload ${incoming} photos. You have ${currentCount}/10 already. Max is 10.`,
      });
    }

    // Upload all files to Cloudinary in parallel
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, `weddingLawn/lawns/${lawn._id}`)
    );
    const results = await Promise.all(uploadPromises);

    // Extract secure URLs
    const newUrls = results.map((r) => r.secure_url);

    // Push new URLs into lawn.photos array
    lawn.photos.push(...newUrls);
    await lawn.save();

    res.status(200).json({
      success: true,
      message: `${newUrls.length} photo(s) uploaded successfully`,
      photos:  lawn.photos,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  DELETE /api/upload/lawn-photos/:lawnId ──────
// ─── @access Owner only
// Body: { photoUrl: "https://res.cloudinary.com/..." }
const deleteLawnPhoto = async (req, res, next) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ message: "photoUrl is required" });
    }

    const lawn = await Lawn.findById(req.params.lawnId);

    if (!lawn) {
      return res.status(404).json({ message: "Lawn not found" });
    }

    if (lawn.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!lawn.photos.includes(photoUrl)) {
      return res.status(404).json({ message: "Photo not found in this lawn" });
    }

    // Extract Cloudinary public_id from URL
    // e.g. https://res.cloudinary.com/cloud/image/upload/v123/weddingLawn/lawns/id/abc.jpg
    //  → public_id = weddingLawn/lawns/id/abc
    const urlParts  = photoUrl.split("/");
    const uploadIdx = urlParts.indexOf("upload");
    // skip version segment (v12345) if present
    const startIdx  = urlParts[uploadIdx + 1]?.startsWith("v")
      ? uploadIdx + 2
      : uploadIdx + 1;
    const publicIdWithExt = urlParts.slice(startIdx).join("/");
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // remove extension

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Remove from lawn.photos array
    lawn.photos = lawn.photos.filter((p) => p !== photoUrl);
    await lawn.save();

    res.status(200).json({
      success: true,
      message: "Photo deleted successfully",
      photos:  lawn.photos,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  PUT /api/upload/lawn-photos/:lawnId/reorder ─
// ─── @access Owner only
// Body: { photos: ["url1", "url2", ...] }  (reordered array)
const reorderPhotos = async (req, res, next) => {
  try {
    const { photos } = req.body;
    const lawn = await Lawn.findById(req.params.lawnId);

    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    if (lawn.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Validate that all URLs belong to this lawn
    const valid = photos.every((url) => lawn.photos.includes(url));
    if (!valid) {
      return res.status(400).json({ message: "Invalid photo URLs in reorder request" });
    }

    lawn.photos = photos;
    await lawn.save();

    res.status(200).json({ success: true, message: "Photos reordered", photos: lawn.photos });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadLawnPhotos, deleteLawnPhoto, reorderPhotos };