const crypto   = require("crypto");
const Razorpay = require("razorpay");
const Booking  = require("../models/Booking");
const Payment  = require("../models/Payment");
const Lawn     = require("../models/Lawn");
const sendEmail = require("../utils/sendEmail");
const { paymentSuccessEmail } = require("../utils/emailTemplates");

// Initialise Razorpay instance
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── @route  POST /api/payment/create-order ──────────────
// ─── @access User only
// Creates a Razorpay order for a confirmed booking
const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    // Load booking and validate ownership
    const booking = await Booking.findById(bookingId)
      .populate("lawnId", "name pricePerDay ownerId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message: "Only confirmed bookings can be paid for",
      });
    }

    if (booking.paymentId) {
      return res.status(400).json({ message: "This booking is already paid" });
    }

    // Amount in paise (Razorpay requires smallest currency unit)
    const amountInPaise = booking.totalAmount * 100;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: "INR",
      receipt:  `booking_${bookingId}`,
      notes: {
        bookingId: bookingId.toString(),
        lawnName:  booking.lawnId.name,
        userId:    req.user._id.toString(),
      },
    });

    // Save initial payment record with status "created"
    const payment = await Payment.create({
      bookingId,
      razorpayOrderId:   order.id,
      razorpayPaymentId: "",
      amount:            booking.totalAmount,
      currency:          "INR",
      status:            "created",
    });

    res.status(200).json({
      success: true,
      order: {
        id:       order.id,
        amount:   order.amount,
        currency: order.currency,
      },
      paymentId:   payment._id,
      keyId:       process.env.RAZORPAY_KEY_ID, // safe to send to frontend
      bookingInfo: {
        id:        booking._id,
        lawnName:  booking.lawnId.name,
        eventDate: booking.eventDate,
        amount:    booking.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  POST /api/payment/verify ────────────────────
// ─── @access User only
// Verifies Razorpay HMAC signature and marks booking as paid
const verifyPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    // ── HMAC SHA256 signature verification ───────────────
    const body      = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected  = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed — invalid signature",
      });
    }

    // ── Signature valid — update records ─────────────────

    // 1. Update Payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        $set: {
          razorpayPaymentId,
          status: "success",
          paidAt: new Date(),
        },
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // 2. Link payment to booking + keep status as confirmed (already confirmed by owner)
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: { paymentId: payment._id } },
      { new: true }
    )
      .populate("lawnId", "name city")
      .populate("userId", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 3. Send payment success email to user
    sendEmail(
      booking.userId.email,
      "Payment Successful — WeddingLawn 💍",
      paymentSuccessEmail(
        booking.userId.name,
        booking.lawnId.name,
        booking.eventDate,
        payment.amount,
        razorpayPaymentId
      )
    ).catch((e) => console.error("Email error:", e.message));

    res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed!",
      payment,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/payment/history ────────────────────
// ─── @access Protected (user sees own, owner sees their lawns)
const getPaymentHistory = async (req, res, next) => {
  try {
    const userId   = req.user._id;
    const userRole = req.user.role;

    let bookingFilter = {};

    if (userRole === "user") {
      bookingFilter = { userId };
    } else if (userRole === "owner") {
      // Get all lawns owned by this user
      const lawns   = await Lawn.find({ ownerId: userId }).select("_id");
      const lawnIds = lawns.map((l) => l._id);
      bookingFilter = { lawnId: { $in: lawnIds } };
    }
    // Admin sees all — no filter needed

    // Find bookings that have a payment
    const bookings = await Booking.find({
      ...bookingFilter,
      paymentId: { $ne: null },
    }).select("_id");

    const bookingIds = bookings.map((b) => b._id);

    const payments = await Payment.find({
      bookingId: { $in: bookingIds },
      status:    "success",
    })
      .populate({
        path:   "bookingId",
        select: "eventDate totalAmount status",
        populate: [
          { path: "lawnId", select: "name city" },
          { path: "userId", select: "name email" },
        ],
      })
      .sort({ paidAt: -1 });

    const total = payments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      count:   payments.length,
      total,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/payment/:paymentId ─────────────────
// ─── @access Protected
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate({
      path:   "bookingId",
      populate: [
        { path: "lawnId", select: "name city address" },
        { path: "userId", select: "name email phone" },
      ],
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Access control — only the user who paid or the lawn owner or admin
    const booking   = payment.bookingId;
    const isUser    = booking.userId._id.toString() === req.user._id.toString();
    const lawnOwner = await Lawn.findById(booking.lawnId._id).select("ownerId");
    const isOwner   = lawnOwner?.ownerId.toString() === req.user._id.toString();
    const isAdmin   = req.user.role === "admin";

    if (!isUser && !isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

// ─── @route  POST /api/payment/webhook ───────────────────
// ─── @access Public (Razorpay server calls this)
// Optional: handle Razorpay webhooks for payment.failed events
const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      const signature = req.headers["x-razorpay-signature"];
      const body      = JSON.stringify(req.body);
      const expected  = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (signature !== expected) {
        return res.status(400).json({ message: "Invalid webhook signature" });
      }
    }

    const { event, payload } = req.body;

    if (event === "payment.failed") {
      const orderid = payload.payment.entity.order_id;
      await Payment.findOneAndUpdate(
        { razorpayOrderId: orderid },
        { $set: { status: "failed" } }
      );
      console.log(`❌ Payment failed for order: ${orderid}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(200).json({ received: true }); // always 200 to Razorpay
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentById,
  handleWebhook,
};