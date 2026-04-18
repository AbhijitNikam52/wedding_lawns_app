const Message = require("../models/Message");
const Lawn    = require("../models/Lawn");
const User    = require("../models/User");

// ─── Helper: build room ID deterministically ──────────────
// Same room regardless of who initiates the chat
const getRoomId = (lawnId, userId) => `lawn_${lawnId}_user_${userId}`;

// ─── @route  POST /api/chat/:lawnId ──────────────────────
// ─── @access Protected (user or owner)
// Body: { message, receiverId }
const sendMessage = async (req, res, next) => {
  try {
    const { lawnId }              = req.params;
    const { message, receiverId } = req.body;
    const senderId                = req.user._id;

    // Verify lawn exists
    const lawn = await Lawn.findById(lawnId);
    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    // Verify receiver exists
    const receiver = await User.findById(receiverId).select("name email");
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    // Save message to DB
    const newMessage = await Message.create({
      senderId,
      receiverId,
      lawnId,
      message,
      isRead:    false,
      timestamp: new Date(),
    });

    const populated = await newMessage.populate([
      { path: "senderId",   select: "name email role" },
      { path: "receiverId", select: "name email role" },
    ]);

    // Emit via Socket.io to the room in real-time
    const roomId = getRoomId(lawnId, req.user.role === "user" ? senderId : receiverId);
    req.io?.to(roomId).emit("receive_message", {
      _id:        populated._id,
      senderId:   populated.senderId,
      receiverId: populated.receiverId,
      lawnId,
      message:    populated.message,
      isRead:     false,
      timestamp:  populated.timestamp,
    });

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/chat/:lawnId ───────────────────────
// ─── @access Protected
// Returns full message history between current user and the lawn owner
const getChatHistory = async (req, res, next) => {
  try {
    const { lawnId } = req.params;
    const userId     = req.user._id;
    const userRole   = req.user.role;

    const lawn = await Lawn.findById(lawnId);
    if (!lawn) return res.status(404).json({ message: "Lawn not found" });

    let filter;
    if (userRole === "owner") {
      // Owner sees ALL conversations for this lawn
      filter = { lawnId };
    } else {
      // User sees only their conversation with the owner
      filter = {
        lawnId,
        $or: [
          { senderId: userId,          receiverId: lawn.ownerId },
          { senderId: lawn.ownerId,    receiverId: userId       },
        ],
      };
    }

    const messages = await Message.find(filter)
      .populate("senderId",   "name email role")
      .populate("receiverId", "name email role")
      .sort({ timestamp: 1 });

    res.status(200).json({
      success:  true,
      count:    messages.length,
      messages,
      roomId:   getRoomId(lawnId, userRole === "owner" ? userId : userId),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/chat/conversations ─────────────────
// ─── @access Protected
// Returns list of unique conversations (one per lawn) for current user
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all messages where this user is sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .populate("senderId",   "name email role")
      .populate("receiverId", "name email role")
      .populate("lawnId",     "name city photos ownerId")
      .sort({ timestamp: -1 });

    // Group by lawnId — keep only latest message per lawn conversation
    const conversationMap = new Map();
    for (const msg of messages) {
      const lawnKey = msg.lawnId?._id?.toString();
      if (lawnKey && !conversationMap.has(lawnKey)) {
        // Count unread messages for this user in this lawn
        const unread = await Message.countDocuments({
          lawnId:     msg.lawnId._id,
          receiverId: userId,
          isRead:     false,
        });

        conversationMap.set(lawnKey, {
          lawnId:      msg.lawnId,
          lastMessage: msg.message,
          timestamp:   msg.timestamp,
          unreadCount: unread,
          otherUser:
            msg.senderId._id.toString() === userId.toString()
              ? msg.receiverId
              : msg.senderId,
        });
      }
    }

    const conversations = Array.from(conversationMap.values());

    res.status(200).json({ success: true, count: conversations.length, conversations });
  } catch (error) {
    next(error);
  }
};

// ─── @route  PUT /api/chat/:lawnId/read ──────────────────
// ─── @access Protected
// Marks all messages in this lawn conversation as read for current user
const markAsRead = async (req, res, next) => {
  try {
    const { lawnId } = req.params;
    const userId     = req.user._id;

    await Message.updateMany(
      { lawnId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    // Notify sender that messages were read via socket
    req.io?.to(lawnId).emit("messages_read", { lawnId, readBy: userId });

    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/chat/:lawnId/unread-count ──────────
// ─── @access Protected
const getUnreadCount = async (req, res, next) => {
  try {
    const { lawnId } = req.params;
    const userId     = req.user._id;

    const count = await Message.countDocuments({
      lawnId,
      receiverId: userId,
      isRead:     false,
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    next(error);
  }
};

// ─── @route  DELETE /api/chat/message/:messageId ─────────
// ─── @access Protected — only sender can delete their own message
const deleteMessage = async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    if (msg.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await msg.deleteOne();

    res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  getRoomId,
};