// ─────────────────────────────────────────────────────────
//  WeddingLawn Booking Platform — Backend Server
//  Entry Point: server.js
// ─────────────────────────────────────────────────────────

require("dotenv").config();

const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");

const connectDB      = require("./config/db");
const errorHandler   = require("./middleware/errorHandler");

// Route files
const authRoutes   = require("./routes/authRoutes");
const lawnRoutes   = require("./routes/lawnRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
// Future routes (uncomment as you build each day):
// const bookingRoutes  = require("./routes/bookingRoutes");
// const chatRoutes     = require("./routes/chatRoutes");
// const paymentRoutes  = require("./routes/paymentRoutes");

// ─── Connect to MongoDB ───────────────────────────────────
connectDB();

// ─── Initialize Express ───────────────────────────────────
const app    = express();
const server = http.createServer(app);   // HTTP server (needed for Socket.io)

// ─── Socket.io Setup ─────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Socket.io connection handler (Day 12 — chat feature)
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join_room", ({ room }) => {
    socket.join(room);
    console.log(`📦 User joined room: ${room}`);
  });

  socket.on("send_message", (data) => {
    // Broadcast to everyone in the room except sender
    socket.to(data.lawnId).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Attach io to req so controllers can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── Security Middleware ──────────────────────────────────
app.use(helmet());

// Rate limiting: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// ─── CORS ─────────────────────────────────────────────────
app.use(
  cors({
    origin:      process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ─── Body Parser ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "💍 WeddingLawn API is running",
    version: "1.0.0",
    status:  "OK",
  });
});

// ─── API Routes ───────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/lawns",    lawnRoutes);
app.use("/api/upload",   uploadRoutes);
// app.use("/api/bookings", bookingRoutes);   // Day 10
// app.use("/api/chat",     chatRoutes);      // Day 12
// app.use("/api/payment",  paymentRoutes);   // Day 14
// app.use("/api/upload",   uploadRoutes);    // Day 7

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler (must be last) ─────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 MongoDB: Connecting...`);
});