// Role-based access control utilities
import { secureStorage } from "./security";

/**
 * Normalize role name to lowercase without spaces
 * @param {string} role - Role name to normalize
 * @returns {string} - Normalized role name
 */
const normalizeRole = (role) => {
  if (!role) return '';
  return role.toLowerCase().replace(/\s+/g, '');
};

/**
 * Check if user has access to a specific feature/route based on their role
 * @param {string} role - Current user's role
 * @param {string[]} allowedRoles - Array of roles that have access
 * @returns {boolean} - Whether user has access
 */
export const hasAccess = (role, allowedRoles) => {
  if (!role || !allowedRoles) return false;
  const normalizedUserRole = normalizeRole(role);
  const normalizedAllowedRoles = allowedRoles.map(r => normalizeRole(r));
  return normalizedAllowedRoles.includes(normalizedUserRole);
};

/**
 * Role hierarchy for permission checks
 * Higher number = more permissions
 */
export const roleHierarchy = {
  'superadmin': 9,
  'admin': 11,
  'committeeoftrustees': 8,
  "boscontroller":7,
      "bosmembers":10,
  'coursemanagement': 6,
  'tutormanagement': 5,
  'usermanagement': 4,
  'documentverification': 3,
  'marketing': 2,
  'auditor': 1,
};

/**
 * Check if user has minimum role level
 * @param {string} role - Current user's role
 * @param {string} minimumRole - Minimum required role
 * @returns {boolean} - Whether user meets minimum role requirement
 */
export const hasMinimumRole = (role, minimumRole) => {
  const normalizedRole = normalizeRole(role);
  const normalizedMinRole = normalizeRole(minimumRole);
  const userLevel = roleHierarchy[normalizedRole] || 0;
  const minimumLevel = roleHierarchy[normalizedMinRole] || 0;
  return userLevel >= minimumLevel;
};

/**
 * Get user-friendly role name
 * @param {string} role - Role key
 * @returns {string} - Formatted role name
 */
export const getRoleDisplayName = (role) => {
  const normalizedRole = normalizeRole(role);
  const roleMap = {
    superadmin: "Super Admin",
    admin: "Admin",
    committeeoftrustees: "Committee of Trustees",
  boscontroller:"boscontroller",
      bosmembers:"bosmembers",
    coursemanagement: "Course Management & PCM Dashboard",
    tutormanagement: "Tutor Dashboard & Termination",
    usermanagement: "User Management & Data Maintenance",
    documentverification: "Document Verification Centre",
    marketing: "Marketing",
    auditor: "Auditor",
  };
  return roleMap[normalizedRole] || role;
};

/**
 * Define menu access permissions
 */
export const menuAccessRoles = {
  dashboard: ["superadmin", "admin", "committeeoftrustees","boscontroller",
      "bosmembers", "coursemanagement", "tutormanagement", "usermanagement", "documentverification", "marketing", "auditor"],
  adminUsers: ["superadmin", "admin", "committeeoftrustees"],
  users: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  courses: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  bos: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  dataMaintenance: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  institutionalBoard: ["superadmin", "admin", "committeeoftrustees"],
  directMeetManagement: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  documentVerification: ["superadmin", "admin", "committeeoftrustees", "documentverification"],
  marketing: ["superadmin", "admin", "committeeoftrustees", "marketing"],
  certificateMaintenance: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  vote: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  notifications: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers", "coursemanagement", "tutormanagement", "usermanagement", "documentverification", "marketing", "auditor"],
  feedback: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  financialAuditing: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  tutorManagement: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  pcmDashboard: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
};

/**
 * Check if user can access a specific menu item
 * @param {string} role - Current user's role
 * @param {string} menuKey - Menu key to check
 * @returns {boolean} - Whether user can access the menu
 */
export const canAccessMenu = (role, menuKey) => {
  const allowedRoles = menuAccessRoles[menuKey];
  return hasAccess(role, allowedRoles);
};

/**
 * React hook for role-based rendering
 * @param {string} role - Current user's role
 * @param {string[]} allowedRoles - Roles that can see the content
 * @returns {boolean} - Whether to render the component
 */
export const useRoleAccess = (role, allowedRoles) => {
  return hasAccess(role, allowedRoles);
};

/**
 * Higher-order component for role-based access control
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {string[]} allowedRoles - Roles that can access the component
 * @returns {React.Component} - Wrapped component with access control
 */
export const withRoleAccess = (WrappedComponent, allowedRoles) => {
  return (props) => {
    // Use secure storage to get role
    const role = secureStorage.getItem("role");
    
    if (!hasAccess(role, allowedRoles)) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          color: '#ef4444',
          fontSize: '1.2rem'
        }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Required roles: {allowedRoles.map(role => getRoleDisplayName(role)).join(', ')}
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Your role: {getRoleDisplayName(role)}
          </p>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

// All available roles in the system
export const allRoles = [
  "superadmin",
  "admin",
  "committeeoftrustees",
  "boscontroller",
  "bosmembers",
  "coursemanagement",
  "tutormanagement",
  "usermanagement",
  "documentverification",
  "marketing",
  "auditor",
];
