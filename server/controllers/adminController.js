const User    = require("../models/User");
const Lawn    = require("../models/Lawn");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

// ─── @route  GET /api/admin/stats ────────────────────────
// ─── @access Admin only
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalOwners,
      totalLawns,
      pendingLawns,
      approvedLawns,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalPayments,
      revenueData,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "owner" }),
      Lawn.countDocuments(),
      Lawn.countDocuments({ isApproved: false }),
      Lawn.countDocuments({ isApproved: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Payment.countDocuments({ status: "success" }),
      Payment.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    // Recent activity — last 5 bookings
    const recentBookings = await Booking.find()
      .populate("userId",  "name email")
      .populate("lawnId",  "name city")
      .sort({ createdAt: -1 })
      .limit(5);

    // Monthly revenue for current year
    const year = new Date().getFullYear();
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: "success",
          paidAt: {
            $gte: new Date(`${year}-01-01`),
            $lt:  new Date(`${year + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id:   { $month: "$paidAt" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users:    { total: totalUsers,  owners: totalOwners },
        lawns:    { total: totalLawns,  pending: pendingLawns, approved: approvedLawns },
        bookings: {
          total:     totalBookings,
          pending:   pendingBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
        },
        payments:       { total: totalPayments, revenue: totalRevenue },
        recentBookings,
        monthlyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/admin/users ────────────────────────
// ─── @access Admin only
const getAllUsers = async (req, res, next) => {
  try {
    const {
      role,
      search,
      page  = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (role)   filter.role  = role;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  PUT /api/admin/users/:id/role ───────────────
// ─── @access Admin only
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!["user", "owner", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ success: true, message: `Role updated to ${role}`, user });
  } catch (error) {
    next(error);
  }
};

// ─── @route  PUT /api/admin/users/:id/suspend ────────────
// ─── @access Admin only
const toggleSuspend = async (req, res, next) => {
  try {
    const { isSuspended } = req.body;

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot suspend yourself" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      success: true,
      message: `User ${isSuspended ? "suspended" : "reactivated"} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  DELETE /api/admin/users/:id ─────────────────
// ─── @access Admin only
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getAllUsers,
  updateUserRole,
  toggleSuspend,
  deleteUser,
};