const Booking      = require("../models/Booking");
const Lawn         = require("../models/Lawn");
const Availability = require("../models/Availability");
const sendEmail    = require("../utils/sendEmail");
const {
  bookingCreatedEmail,
  bookingConfirmedEmail,
} = require("../utils/emailTemplates");

// ─── Helper: midnight UTC ─────────────────────────────────
const toMidnight = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// ─── @route  POST /api/bookings ───────────────────────────
// ─── @access User only
const createBooking = async (req, res, next) => {
  try {
    const { lawnId, eventDate, guestCount, specialRequests } = req.body;

    // 1. Check lawn exists and is approved
    const lawn = await Lawn.findById(lawnId).populate("ownerId", "name email");
    if (!lawn)            return res.status(404).json({ message: "Lawn not found" });
    if (!lawn.isApproved) return res.status(400).json({ message: "This lawn is not available for booking" });

    // 2. Check availability record exists for this date
    const midnight = toMidnight(eventDate);
    const avail    = await Availability.findOne({ lawnId, date: midnight });

    if (!avail || avail.isBooked || avail.isBlocked) {
      return res.status(409).json({
        message: "This date is not available. Please choose another date.",
      });
    }

    // 3. Check no existing pending/confirmed booking for same lawn + date
    const duplicate = await Booking.findOne({
      lawnId,
      eventDate: midnight,
      status:    { $in: ["pending", "confirmed"] },
    });
    if (duplicate) {
      return res.status(409).json({ message: "This date already has an active booking" });
    }

    // 4. Create booking
    const booking = await Booking.create({
      lawnId,
      userId:          req.user._id,
      eventDate:       midnight,
      status:          "pending",
      totalAmount:     lawn.pricePerDay,
      guestCount:      guestCount      || 0,
      specialRequests: specialRequests || "",
    });

    // 5. Email user — booking request sent
    sendEmail(
      req.user.email,
      "Booking Request Sent — WeddingLawn 💍",
      bookingCreatedEmail(req.user.name, lawn.name, midnight, lawn.pricePerDay)
    ).catch((e) => console.error("Email error:", e.message));

    // 6. Email owner — new booking request arrived
    sendEmail(
      lawn.ownerId.email,
      `New Booking Request for ${lawn.name} — WeddingLawn`,
      newBookingOwnerEmail(lawn.ownerId.name, lawn.name, req.user.name, midnight, lawn.pricePerDay)
    ).catch((e) => console.error("Email error:", e.message));

    const populated = await booking.populate([
      { path: "lawnId", select: "name city pricePerDay photos" },
      { path: "userId", select: "name email phone" },
    ]);

    res.status(201).json({
      success: true,
      message: "Booking request sent! Awaiting owner confirmation.",
      booking: populated,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/bookings/my ────────────────────────
// ─── @access User only
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate("lawnId", "name city photos pricePerDay address")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/bookings/owner ─────────────────────
// ─── @access Owner only — all bookings for owner's lawns
const getOwnerBookings = async (req, res, next) => {
  try {
    // Find all lawns owned by this user
    const ownerLawns = await Lawn.find({ ownerId: req.user._id }).select("_id");
    const lawnIds    = ownerLawns.map((l) => l._id);

    const { status } = req.query; // optional filter
    const filter     = { lawnId: { $in: lawnIds } };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("lawnId", "name city photos pricePerDay")
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/bookings/:id ───────────────────────
// ─── @access User (own booking) or Owner (their lawn) or Admin
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("lawnId",  "name city address photos pricePerDay ownerId")
      .populate("userId",  "name email phone")
      .populate("paymentId");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Access control
    const isUser  = booking.userId._id.toString() === req.user._id.toString();
    const isOwner = booking.lawnId.ownerId?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isUser && !isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this booking" });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// ─── @route  PUT /api/bookings/:id/status ────────────────
// ─── @access Owner (confirm/cancel) | User (cancel own)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate("lawnId",  "name ownerId pricePerDay")
      .populate("userId",  "name email");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isOwner = booking.lawnId.ownerId?.toString() === req.user._id.toString();
    const isUser  = booking.userId._id.toString()      === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    // ── Permission rules ──────────────────────────────────
    if (status === "confirmed") {
      if (!isOwner && !isAdmin)
        return res.status(403).json({ message: "Only the lawn owner can confirm bookings" });
      if (booking.status !== "pending")
        return res.status(400).json({ message: "Only pending bookings can be confirmed" });
    }

    if (status === "cancelled") {
      if (!isOwner && !isUser && !isAdmin)
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      if (["completed", "cancelled"].includes(booking.status))
        return res.status(400).json({ message: `Cannot cancel a ${booking.status} booking` });
    }

    if (status === "completed") {
      if (!isOwner && !isAdmin)
        return res.status(403).json({ message: "Only the lawn owner can mark booking as completed" });
      if (booking.status !== "confirmed")
        return res.status(400).json({ message: "Only confirmed bookings can be completed" });
    }

    const oldStatus    = booking.status;
    booking.status     = status;
    booking.cancelReason = reason || "";
    await booking.save();

    // ── Update Availability based on new status ───────────
    const midnight = toMidnight(booking.eventDate);

    if (status === "confirmed") {
      // Lock the date — mark as booked
      await Availability.findOneAndUpdate(
        { lawnId: booking.lawnId._id, date: midnight },
        { $set: { isBooked: true } },
        { upsert: true }
      );
    }

    if (status === "cancelled") {
      // Free the date again if it was confirmed
      if (oldStatus === "confirmed") {
        await Availability.findOneAndUpdate(
          { lawnId: booking.lawnId._id, date: midnight },
          { $set: { isBooked: false } }
        );
      }
    }

    // ── Send email notifications ──────────────────────────
    const user  = booking.userId;
    const lawn  = booking.lawnId;

    if (status === "confirmed") {
      sendEmail(
        user.email,
        "Your Booking is Confirmed! 🎉 — WeddingLawn",
        bookingConfirmedEmail(user.name, lawn.name, booking.eventDate)
      ).catch((e) => console.error("Email error:", e.message));
    }

    if (status === "cancelled") {
      sendEmail(
        user.email,
        "Booking Cancelled — WeddingLawn",
        bookingCancelledEmail(user.name, lawn.name, booking.eventDate, reason)
      ).catch((e) => console.error("Email error:", e.message));
    }

    if (status === "completed") {
      sendEmail(
        user.email,
        "Booking Completed — Thank You! 💍 WeddingLawn",
        bookingCompletedEmail(user.name, lawn.name, booking.eventDate)
      ).catch((e) => console.error("Email error:", e.message));
    }

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/bookings/admin/all ─────────────────
// ─── @access Admin only
const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(filter);

    const bookings = await Booking.find(filter)
      .populate("lawnId", "name city")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Local email template helpers ────────────────────────
const newBookingOwnerEmail = (ownerName, lawnName, userName, eventDate, amount) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e9d5ff;border-radius:12px;overflow:hidden;">
    <div style="background:#4A1D6E;padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">💍 New Booking Request</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#555;">Hi ${ownerName},</p>
      <p style="color:#555;">You have a new booking request for <strong>${lawnName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr style="background:#f9f3ff;">
          <td style="padding:10px 16px;font-weight:bold;color:#4A1D6E;border:1px solid #e9d5ff;">Customer</td>
          <td style="padding:10px 16px;color:#555;border:1px solid #e9d5ff;">${userName}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-weight:bold;color:#4A1D6E;border:1px solid #e9d5ff;">Event Date</td>
          <td style="padding:10px 16px;color:#555;border:1px solid #e9d5ff;">${new Date(eventDate).toDateString()}</td>
        </tr>
        <tr style="background:#f9f3ff;">
          <td style="padding:10px 16px;font-weight:bold;color:#4A1D6E;border:1px solid #e9d5ff;">Amount</td>
          <td style="padding:10px 16px;color:#16A34A;font-weight:bold;border:1px solid #e9d5ff;">₹${amount.toLocaleString()}</td>
        </tr>
      </table>
      <p style="color:#555;margin-top:16px;">Login to your dashboard to accept or decline this request.</p>
    </div>
  </div>
`;

const bookingCancelledEmail = (userName, lawnName, eventDate, reason) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e9d5ff;border-radius:12px;overflow:hidden;">
    <div style="background:#DC2626;padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">❌ Booking Cancelled</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#555;">Hi ${userName},</p>
      <p style="color:#555;">Your booking for <strong>${lawnName}</strong> on <strong>${new Date(eventDate).toDateString()}</strong> has been cancelled.</p>
      ${reason ? `<p style="color:#555;"><strong>Reason:</strong> ${reason}</p>` : ""}
      <p style="color:#555;">Browse other available venues on WeddingLawn.</p>
    </div>
  </div>
`;

const bookingCompletedEmail = (userName, lawnName, eventDate) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e9d5ff;border-radius:12px;overflow:hidden;">
    <div style="background:#16A34A;padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">🎊 Booking Completed!</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#555;">Hi ${userName},</p>
      <p style="color:#555;">Your event at <strong>${lawnName}</strong> on <strong>${new Date(eventDate).toDateString()}</strong> is marked as completed.</p>
      <p style="color:#555;">We hope you had a wonderful celebration! 💍</p>
    </div>
  </div>
`;

module.exports = {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getBookingById,
  updateBookingStatus,
  getAllBookings,
};