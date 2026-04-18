const Availability = require("../models/Availability");
const Lawn         = require("../models/Lawn");

// ─── Helper: strip time → midnight UTC ───────────────────
const toMidnight = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// ─── @route  GET /api/availability/:lawnId ────────────────
// ─── @access Public
// Returns all availability records for a lawn
// Optional query: ?month=2024-06  → filter to one month
const getLawnAvailability = async (req, res, next) => {
  try {
    const { lawnId } = req.params;
    const { month }  = req.query; // e.g. "2024-06"

    const lawn = await Lawn.findById(lawnId);
    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    let filter = { lawnId };

    if (month) {
      // Filter to the given month
      const [year, mon] = month.split("-").map(Number);
      const start = new Date(Date.UTC(year, mon - 1, 1));
      const end   = new Date(Date.UTC(year, mon,     1)); // first day of next month
      filter.date = { $gte: start, $lt: end };
    }

    const records = await Availability.find(filter).sort({ date: 1 });

    // Return a clean map: { "2024-06-15": { isBooked, isBlocked } }
    const availabilityMap = {};
    records.forEach((r) => {
      const key = r.date.toISOString().split("T")[0]; // "YYYY-MM-DD"
      availabilityMap[key] = {
        isBooked:  r.isBooked,
        isBlocked: r.isBlocked,
        _id:       r._id,
      };
    });

    res.status(200).json({ success: true, availability: availabilityMap });
  } catch (error) {
    next(error);
  }
};

// ─── @route  POST /api/availability/:lawnId/mark ──────────
// ─── @access Owner only (must own the lawn)
// Body: { dates: ["2024-06-15", "2024-06-16", ...] }
// Marks those dates as AVAILABLE (isBooked: false, isBlocked: false)
const markDatesAvailable = async (req, res, next) => {
  try {
    const { lawnId } = req.params;
    const { dates }  = req.body;

    const lawn = await Lawn.findById(lawnId);
    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    if (lawn.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Upsert each date — create if not exists, update if exists
    const ops = dates.map((d) => ({
      updateOne: {
        filter: { lawnId, date: toMidnight(d) },
        update: { $set: { isBooked: false, isBlocked: false } },
        upsert: true,
      },
    }));

    await Availability.bulkWrite(ops);

    res.status(200).json({
      success: true,
      message: `${dates.length} date(s) marked as available`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  PUT /api/availability/:lawnId/block ──────────
// ─── @access Owner only
// Body: { date: "2024-06-15", isBlocked: true }
// Toggles block on a single date
const toggleBlockDate = async (req, res, next) => {
  try {
    const { lawnId }   = req.params;
    const { date, isBlocked } = req.body;

    const lawn = await Lawn.findById(lawnId);
    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    if (lawn.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const midnight = toMidnight(date);

    const record = await Availability.findOneAndUpdate(
      { lawnId, date: midnight },
      { $set: { isBlocked } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Date ${isBlocked ? "blocked" : "unblocked"} successfully`,
      record,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  DELETE /api/availability/:lawnId/mark ────────
// ─── @access Owner only
// Body: { dates: ["2024-06-15"] }
// Removes dates from available list (owner un-marks them)
const removeDatesAvailable = async (req, res, next) => {
  try {
    const { lawnId } = req.params;
    const { dates }  = req.body;

    const lawn = await Lawn.findById(lawnId);
    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    if (lawn.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const midnights = dates.map(toMidnight);

    await Availability.deleteMany({
      lawnId,
      date:      { $in: midnights },
      isBooked:  false, // never delete already-booked dates
    });

    res.status(200).json({
      success: true,
      message: `${dates.length} date(s) removed from availability`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/availability/:lawnId/check ──────────
// ─── @access Public
// Query: ?date=2024-06-15
// Returns whether a specific date is available for booking
const checkDateAvailability = async (req, res, next) => {
  try {
    const { lawnId } = req.params;
    const { date }   = req.query;

    if (!date) {
      return res.status(400).json({ message: "date query param is required" });
    }

    const lawn = await Lawn.findById(lawnId);
    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    const midnight = toMidnight(date);
    const record   = await Availability.findOne({ lawnId, date: midnight });

    const isAvailable =
      record &&
      !record.isBooked &&
      !record.isBlocked;

    res.status(200).json({
      success:     true,
      date,
      isAvailable,
      isBooked:    record?.isBooked  ?? false,
      isBlocked:   record?.isBlocked ?? false,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/availability/:lawnId/owner ──────────
// ─── @access Owner only
// Returns ALL dates for owner dashboard management
// (includes blocked and booked dates, not just available)
const getOwnerAvailability = async (req, res, next) => {
  try {
    const { lawnId } = req.params;

    const lawn = await Lawn.findById(lawnId);
    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    if (lawn.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const records = await Availability.find({ lawnId }).sort({ date: 1 });

    const availabilityMap = {};
    records.forEach((r) => {
      const key = r.date.toISOString().split("T")[0];
      availabilityMap[key] = {
        isBooked:  r.isBooked,
        isBlocked: r.isBlocked,
        _id:       r._id,
      };
    });

    res.status(200).json({ success: true, availability: availabilityMap });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLawnAvailability,
  markDatesAvailable,
  toggleBlockDate,
  removeDatesAvailable,
  checkDateAvailability,
  getOwnerAvailability,
};