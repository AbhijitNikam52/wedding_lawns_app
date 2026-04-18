const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Booking",
      required: true,
    },
    razorpayOrderId: {
      type:     String,
      required: true,
    },
    razorpayPaymentId: {
      type:    String,
      default: "",
    },
    amount: {
      type:     Number,
      required: true,
    },
    currency: {
      type:    String,
      default: "INR",
    },
    status: {
      type:    String,
      enum:    ["created", "success", "failed"],
      default: "created",
    },
    paidAt: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);