const Message = require("../models/Message");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");

/**
 * Initialise all Socket.io event handlers.
 * Called once from server.js with the `io` instance.
 */
const initSocket = (io) => {
  // ── Auth middleware for sockets ─────────────────────────
  // Attach user to socket from JWT token sent during handshake
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user; // attach user to socket
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} | User: ${socket.user?.name}`);

    // ── Join a lawn chat room ─────────────────────────────
    // Client emits: { lawnId, userId }
    socket.on("join_room", ({ lawnId, userId }) => {
      // Room ID: deterministic so both user and owner land in same room
      const roomId = `lawn_${lawnId}_user_${userId}`;
      socket.join(roomId);
      console.log(`📦 ${socket.user.name} joined room: ${roomId}`);

      // Notify room that user is online
      socket.to(roomId).emit("user_online", {
        userId:   socket.user._id,
        userName: socket.user.name,
      });
    });

    // ── Send a message ────────────────────────────────────
    // Client emits: { lawnId, userId, receiverId, message }
    socket.on("send_message", async (data) => {
      try {
        const { lawnId, userId, receiverId, message } = data;

        // Persist to MongoDB
        const saved = await Message.create({
          senderId:   socket.user._id,
          receiverId,
          lawnId,
          message,
          isRead:    false,
          timestamp: new Date(),
        });

        const populated = await saved.populate([
          { path: "senderId",   select: "name email role" },
          { path: "receiverId", select: "name email role" },
        ]);

        const roomId = `lawn_${lawnId}_user_${userId}`;

        // Broadcast to room (all participants including sender)
        io.to(roomId).emit("receive_message", {
          _id:        populated._id,
          senderId:   populated.senderId,
          receiverId: populated.receiverId,
          lawnId,
          message:    populated.message,
          isRead:     false,
          timestamp:  populated.timestamp,
        });
      } catch (err) {
        console.error("Socket send_message error:", err.message);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // ── Typing indicators ─────────────────────────────────
    // Client emits: { lawnId, userId }
    socket.on("typing_start", ({ lawnId, userId }) => {
      const roomId = `lawn_${lawnId}_user_${userId}`;
      socket.to(roomId).emit("typing_start", {
        userId:   socket.user._id,
        userName: socket.user.name,
      });
    });

    socket.on("typing_stop", ({ lawnId, userId }) => {
      const roomId = `lawn_${lawnId}_user_${userId}`;
      socket.to(roomId).emit("typing_stop", { userId: socket.user._id });
    });

    // ── Read receipts ─────────────────────────────────────
    // Client emits: { lawnId, userId }
    socket.on("mark_read", async ({ lawnId, userId }) => {
      try {
        await Message.updateMany(
          { lawnId, receiverId: socket.user._id, isRead: false },
          { $set: { isRead: true } }
        );
        const roomId = `lawn_${lawnId}_user_${userId}`;
        io.to(roomId).emit("messages_read", {
          lawnId,
          readBy: socket.user._id,
        });
      } catch (err) {
        console.error("Socket mark_read error:", err.message);
      }
    });

    // ── Disconnect ────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id} | ${socket.user?.name}`);
    });
  });
};

module.exports = initSocket;