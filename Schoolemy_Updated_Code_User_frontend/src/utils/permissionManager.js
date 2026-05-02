/**
 * SECURITY FIX 3.32.1: Client-Side Permission Manager
 *
 * IMPORTANT: This is for UI/UX ONLY, NOT for security enforcement
 *
 * Security Rule:
 * - Client-side checks are for showing/hiding UI elements
 * - Server MUST verify all permissions before allowing actions
 * - Never trust client-side role data for access control
 * - Always call server endpoints, server will verify permission
 *
 * Why client-side checks can't be trusted:
 * 1. localStorage can be tampered with via DevTools
 * 2. Browser can be modified with scripts
 * 3. Network requests can be intercepted and modified
 * 4. userData from server can become stale
 *
 * Solution:
 * - Use this utility for UI visibility (show/hide admin menu)
 * - Call server API for actual admin operations
 * - Server has the source of truth for roles
 */

/**
 * Check if user has admin role (for UI purposes only)
 * IMPORTANT: Server must verify before allowing any admin operations
 *
 * @param {object} userData - User data from server
 * @returns {boolean} True if userData indicates admin role (for UI only)
 */
export const hasAdminRole = (userData) => {
  // Only trust userData that came from server (not localStorage)
  if (!userData || typeof userData !== 'object') {
    return false;
  }

  const role = userData.role;

  // Check for admin roles
  return role === 'admin' || role === 'superadmin' || role === 'administrator';
};

/**
 * Check if user has instructor/tutor role (for UI purposes only)
 * IMPORTANT: Server must verify before allowing course creation
 *
 * @param {object} userData - User data from server
 * @returns {boolean} True if userData indicates instructor role (for UI only)
 */
export const hasInstructorRole = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return false;
  }

  const role = userData.role;

  return role === 'tutor' || role === 'instructor' || role === 'teacher';
};

/**
 * Check if user has student role
 *
 * @param {object} userData - User data from server
 * @returns {boolean} True if userData indicates student role
 */
export const hasStudentRole = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return false;
  }

  const role = userData.role;

  return role === 'student' || role === 'user';
};

/**
 * SECURITY FIX 3.32.1: Check if user can create content
 * This is for UI only - server must verify on actual creation
 *
 * @param {object} userData - User data from server
 * @returns {boolean} True if user might have create permission (UI decision only)
 */
export const canCreateContent = (userData) => {
  // Instructors and admins can create content (for UI purposes)
  return hasInstructorRole(userData) || hasAdminRole(userData);
};

/**
 * SECURITY FIX 3.32.1: Check if user can delete content
 * This is for UI only - server must verify on actual deletion
 *
 * @param {object} userData - User data from server
 * @param {object} contentData - Content owner info from server
 * @returns {boolean} True if user might be able to delete (UI decision only)
 */
export const canDeleteContent = (userData, contentData) => {
  if (!userData || !contentData) {
    return false;
  }

  // Admins can delete anything
  if (hasAdminRole(userData)) {
    return true;
  }

  // Content creators can delete their own content
  if (contentData.createdBy && contentData.createdBy === userData._id) {
    return true;
  }

  return false;
};

/**
 * SECURITY FIX 3.32.1: Check if user can edit content
 * This is for UI only - server must verify on actual edit
 *
 * @param {object} userData - User data from server
 * @param {object} contentData - Content owner info from server
 * @returns {boolean} True if user might be able to edit (UI decision only)
 */
export const canEditContent = (userData, contentData) => {
  return canDeleteContent(userData, contentData);
};

/**
 * Get user role for logging/debugging
 * Should only be used for UI display, never for security decisions
 *
 * @param {object} userData - User data from server
 * @returns {string} User role or 'unknown'
 */
export const getUserRole = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return 'unknown';
  }

  return userData.role || 'unknown';
};

/**
 * SECURITY FIX 3.32.1: Check permission and log warning if trusted
 * Useful for debugging permission issues
 *
 * @param {object} userData - User data from server
 * @param {string} requiredRole - Role required for action
 * @param {string} action - Action being checked (for logging)
 * @returns {boolean} True if has role (for UI only)
 */
export const checkPermissionUI = (userData, requiredRole, action = 'unknown') => {
  const hasPermission = checkRoleIncludes(userData?.role, requiredRole);

  if (!hasPermission) {
    console.warn(
      `[PermissionCheck] User ${userData?._id || 'unknown'} lacks permission for ${action}`,
      { userRole: userData?.role, requiredRole }
    );
  }

  return hasPermission;
};

/**
 * Helper: Check if a role includes required permission
 *
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required role
 * @returns {boolean}
 */
const checkRoleIncludes = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) return false;

  // Exact match
  if (userRole === requiredRole) return true;

  // Admin has all permissions
  if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'administrator') {
    return true;
  }

  // Specific role checks
  if (requiredRole === 'instructor') {
    return userRole === 'tutor' || userRole === 'instructor' || userRole === 'teacher';
  }

  return false;
};

/**
 * CRITICAL SECURITY WARNING
 * This should be logged whenever admin operation is attempted
 */
export const logAdminOperation = (operation, userId, details) => {
  console.warn('[AdminOperation]', {
    operation,
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });

  // In production, send this to audit log:
  // fetch('/api/audit-log', {
  //   method: 'POST',
  //   body: JSON.stringify({ operation, userId, timestamp: Date.now(), ...details })
  // });
};

export default {
  hasAdminRole,
  hasInstructorRole,
  hasStudentRole,
  canCreateContent,
  canDeleteContent,
  canEditContent,
  getUserRole,
  checkPermissionUI,
  logAdminOperation,
};
