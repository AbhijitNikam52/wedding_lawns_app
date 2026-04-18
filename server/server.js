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
const notFound       = require("./middleware/notFound");
const sanitize       = require("./middleware/sanitize");

// Route files
const authRoutes         = require("./routes/authRoutes");
const lawnRoutes         = require("./routes/lawnRoutes");
const uploadRoutes       = require("./routes/uploadRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const bookingRoutes      = require("./routes/bookingRoutes");
const chatRoutes         = require("./routes/chatRoutes");
const paymentRoutes      = require("./routes/paymentRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const initSocket         = require("./socket/socketHandler");

// ─── Connect to MongoDB ───────────────────────────────────
connectDB();

// ─── Initialize Express ───────────────────────────────────
const app    = express();
const server = http.createServer(app);   // HTTP server (needed for Socket.io)

// ─── Socket.io Setup ─────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:  process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Initialise all socket events from dedicated handler
initSocket(io);

// Attach io to req so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── Security Middleware ──────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow images from Cloudinary
    contentSecurityPolicy: false,                           // handled by frontend
  })
);

// NoSQL injection sanitization
app.use(sanitize);

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many requests, please try again later." },
  skip: (req) => req.method === "OPTIONS", // skip preflight
});
app.use("/api", limiter);

// ─── CORS ─────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser requests (Postman, curl) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
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
app.use("/api/auth",         authRoutes);
app.use("/api/lawns",        lawnRoutes);
app.use("/api/upload",       uploadRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings",     bookingRoutes);
app.use("/api/chat",         chatRoutes);
app.use("/api/payment",      paymentRoutes);
app.use("/api/admin",        adminRoutes);
// app.use("/api/bookings", bookingRoutes);   // Day 10
// app.use("/api/chat",     chatRoutes);      // Day 12
// app.use("/api/payment",  paymentRoutes);   // Day 14
// app.use("/api/upload",   uploadRoutes);    // Day 7

// ─── 404 & Global Error Handler ──────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 MongoDB: Connecting...`);
});