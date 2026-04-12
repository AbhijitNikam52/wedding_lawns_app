const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "User",
    required: true,
  },
  receiverId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "User",
    required: true,
  },
  lawnId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Lawn",
    required: true,
  },
  message: {
    type:     String,
    required: [true, "Message cannot be empty"],
  },
  isRead: {
    type:    Boolean,
    default: false,
  },
  timestamp: {
    type:    Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", messageSchema);
