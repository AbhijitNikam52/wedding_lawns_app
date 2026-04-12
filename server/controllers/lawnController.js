const Lawn = require("../models/Lawn");

// ─── @route  GET /api/lawns ───────────────────────────────
// ─── @access Public
// Supports query filters: city, minPrice, maxPrice, minCapacity, amenities
const getAllLawns = async (req, res, next) => {
  try {
    const {
      city,
      minPrice,
      maxPrice,
      minCapacity,
      amenities,
      sort  = "createdAt",
      page  = 1,
      limit = 12,
    } = req.query;

    // Build filter — only show admin-approved lawns publicly
    const filter = { isApproved: true };

    if (city)        filter.city     = { $regex: city, $options: "i" };
    if (minCapacity) filter.capacity = { $gte: Number(minCapacity) };
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }
    if (amenities) {
      const list = amenities.split(",").map((a) => a.trim());
      filter.amenities = { $all: list };
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Lawn.countDocuments(filter);

    const lawns = await Lawn.find(filter)
      .populate("ownerId", "name email phone")
      .sort({ [sort]: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      lawns,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/lawns/:id ──────────────────────────
// ─── @access Public
const getLawnById = async (req, res, next) => {
  try {
    const lawn = await Lawn.findById(req.params.id)
      .populate("ownerId", "name email phone");

    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    res.status(200).json({ success: true, lawn });
  } catch (error) {
    next(error);
  }
};

// ─── @route  POST /api/lawns ─────────────────────────────
// ─── @access Owner only
const createLawn = async (req, res, next) => {
  try {
    const { name, city, address, capacity, pricePerDay, description, amenities } = req.body;

    const lawn = await Lawn.create({
      ownerId:     req.user._id,
      name,
      city,
      address,
      capacity,
      pricePerDay,
      description: description || "",
      amenities:   amenities   || [],
    });

    res.status(201).json({
      success: true,
      message: "Lawn created! It will go live after admin approval.",
      lawn,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  PUT /api/lawns/:id ──────────────────────────
// ─── @access Owner only (must own this lawn)
const updateLawn = async (req, res, next) => {
  try {
    const lawn = await Lawn.findById(req.params.id);

    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    if (lawn.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this lawn" });
    }

    const allowed = ["name", "city", "address", "capacity", "pricePerDay", "description", "amenities"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) lawn[field] = req.body[field];
    });

    await lawn.save();

    res.status(200).json({ success: true, message: "Lawn updated successfully", lawn });
  } catch (error) {
    next(error);
  }
};

// ─── @route  DELETE /api/lawns/:id ───────────────────────
// ─── @access Owner or Admin
const deleteLawn = async (req, res, next) => {
  try {
    const lawn = await Lawn.findById(req.params.id);

    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    const isOwner = lawn.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this lawn" });
    }

    await lawn.deleteOne();

    res.status(200).json({ success: true, message: "Lawn deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/lawns/owner/my-lawns ───────────────
// ─── @access Owner only
const getMyLawns = async (req, res, next) => {
  try {
    const lawns = await Lawn.find({ ownerId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: lawns.length, lawns });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/lawns/admin/pending ────────────────
// ─── @access Admin only
const getPendingLawns = async (req, res, next) => {
  try {
    const lawns = await Lawn.find({ isApproved: false })
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: lawns.length, lawns });
  } catch (error) {
    next(error);
  }
};

// ─── @route  PUT /api/lawns/admin/:id/approve ────────────
// ─── @access Admin only
const approveLawn = async (req, res, next) => {
  try {
    const lawn = await Lawn.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    res.status(200).json({ success: true, message: "Lawn approved and now live", lawn });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLawns,
  getLawnById,
  createLawn,
  updateLawn,
  deleteLawn,
  getMyLawns,
  getPendingLawns,
  approveLawn,
};