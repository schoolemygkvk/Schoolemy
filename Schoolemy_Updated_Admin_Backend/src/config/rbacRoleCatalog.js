/**
 * Canonical admin RBAC roles (must stay aligned with scripts/rbacSeed.js).
 * Used to list all roles in the UI even before seed has created every document.
 */

export const DEFAULT_RBAC_ROLE_METADATA = [
  { roleName: "superadmin", displayName: "Super Admin", hierarchy: 100 },
  { roleName: "admin", displayName: "Admin", hierarchy: 90 },
  { roleName: "committeeoftrustees", displayName: "Committee of Trustees", hierarchy: 8 },
  { roleName: "bosmembers", displayName: "BOS Members", hierarchy: 10 },
  { roleName: "boscontroller", displayName: "BOS Controller", hierarchy: 7 },
  { roleName: "coursemanagement", displayName: "Course Management", hierarchy: 6 },
  { roleName: "tutormanagement", displayName: "Tutor Management", hierarchy: 5 },
  { roleName: "usermanagement", displayName: "User Management", hierarchy: 4 },
  { roleName: "documentverification", displayName: "Document Verification", hierarchy: 3 },
  { roleName: "financial", displayName: "Financial", hierarchy: 3 },
  { roleName: "marketing", displayName: "Marketing", hierarchy: 2 },
  { roleName: "auditor", displayName: "Auditor", hierarchy: 1 },
];

export function getCatalogMeta(roleNameLower) {
  return DEFAULT_RBAC_ROLE_METADATA.find((m) => m.roleName === roleNameLower) || null;
}
