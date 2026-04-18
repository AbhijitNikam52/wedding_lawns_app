/**
 * Blocks suspended users from accessing any protected route.
 * Must be used AFTER the protect middleware.
 */
const suspendCheck = (req, res, next) => {
  if (req.user?.isSuspended) {
    return res.status(403).json({
      success: false,
      message:
        "Your account has been suspended. Please contact support at support@weddinglawn.com",
    });
  }
  next();
};

module.exports = suspendCheck;