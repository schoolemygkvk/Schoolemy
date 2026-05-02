// Role-based authorization middleware
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Superadmin always has access to all routes
    if (req.user.role === 'superadmin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Insufficient permissions for this operation',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};
