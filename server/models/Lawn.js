const mongoose = require("mongoose");

const lawnSchema = new mongoose.Schema(
  {
    ownerId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    name: {
      type:     String,
      required: [true, "Lawn name is required"],
      trim:     true,
    },
    city: {
      type:     String,
      required: [true, "City is required"],
      trim:     true,
    },
    address: {
      type:     String,
      required: [true, "Address is required"],
    },
    capacity: {
      type:     Number,
      required: [true, "Capacity is required"],
      min:      [50, "Minimum capacity is 50 guests"],
    },
    pricePerDay: {
      type:     Number,
      required: [true, "Price per day is required"],
      min:      0,
    },
    photos: {
      type:    [String],
      default: [],
    },
    amenities: {
      type:    [String],
      default: [],
      // e.g. ["AC", "Parking", "Catering", "Generator", "Sound System"]
    },
    description: {
      type:    String,
      default: "",
    },
    isApproved: {
      type:    Boolean,
      default: false, // Admin must approve before going live
    },
    rating: {
      type:    Number,
      default: 0,
      min:     0,
      max:     5,
    },
  },
  { timestamps: true }
);

// Indexes for faster search queries
lawnSchema.index({ city: 1 });
lawnSchema.index({ pricePerDay: 1 });
lawnSchema.index({ isApproved: 1 });
lawnSchema.index({ ownerId: 1 });

module.exports = mongoose.model("Lawn", lawnSchema);