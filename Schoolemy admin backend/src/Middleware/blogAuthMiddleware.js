// Middleware to verify admin role for blog management
// This uses the existing authentication from authMiddleware.js
// User info is already attached to req.user by the main verifyToken middleware

const verifyBlogAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated (should be done by main middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }

    // Check if user has admin role
    // Your system uses lowercase roles: 'admin', 'superadmin', etc.
    const allowedRoles = ['admin', 'superadmin'];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Admin privileges required for blog management. Your role: ${req.user.role}`
      });
    }

    // User is authenticated and is admin, proceed
    next();
  } catch (error) {
    console.error('Blog admin verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authorization',
      error: error.message
    });
  }
};

export default verifyBlogAdmin;
