const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    lawnId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Lawn",
      required: true,
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    eventDate: {
      type:     Date,
      required: [true, "Event date is required"],
    },
    status: {
      type:    String,
      enum:    ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    totalAmount: {
      type:     Number,
      required: true,
    },
    guestCount: {
      type:    Number,
      default: 0,
    },
    specialRequests: {
      type:    String,
      default: "",
    },
    paymentId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Payment",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
