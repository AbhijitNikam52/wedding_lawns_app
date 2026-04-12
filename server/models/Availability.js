const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  lawnId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Lawn",
    required: true,
  },
  date: {
    type:     Date,
    required: true,
  },
  isBooked: {
    type:    Boolean,
    default: false,
  },
  isBlocked: {
    type:    Boolean,
    default: false, // Owner manually blocked
  },
});

// Compound index: one record per lawn per date
availabilitySchema.index({ lawnId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Availability", availabilitySchema);
