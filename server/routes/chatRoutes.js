const express = require("express");
const router  = express.Router();

const { protect }  = require("../middleware/authMiddleware");
const validate     = require("../middleware/validate");
const { sendMessageSchema } = require("../middleware/validators/chatValidator");
const {
  sendMessage,
  getChatHistory,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteMessage,
} = require("../controllers/chatController");

// All chat routes require auth
router.use(protect);

// GET  /api/chat/conversations          — all conversations for current user
router.get("/conversations", getConversations);

// GET  /api/chat/:lawnId                — message history for a lawn chat
router.get("/:lawnId", getChatHistory);

// POST /api/chat/:lawnId                — send a message (also persists to DB)
router.post("/:lawnId", validate(sendMessageSchema), sendMessage);

// PUT  /api/chat/:lawnId/read           — mark all messages as read
router.put("/:lawnId/read", markAsRead);

// GET  /api/chat/:lawnId/unread-count   — unread message count
router.get("/:lawnId/unread-count", getUnreadCount);

// DELETE /api/chat/message/:messageId   — delete own message
router.delete("/message/:messageId", deleteMessage);

module.exports = router;