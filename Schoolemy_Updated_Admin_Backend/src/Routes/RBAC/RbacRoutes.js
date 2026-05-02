import express from "express";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import { checkRole } from "../../Middleware/checkRole.js";
import {
  getAllRoles,
  getRoleByName,
  updatePermissions,
  createRole,
  deleteRole,
  seedRBACRoles,
  getRBACStatus,
} from "../../Controllers/RBAC/RbacController.js";

const router = express.Router();

/**
 * POST /api/rbac/roles
 * Create a new role (superadmin only)
 */
router.post(
  "/api/rbac/roles",
  verifyToken,
  checkRole(["superadmin"]),
  createRole
);

/**
 * GET /api/rbac/roles
 * Fetch all roles with permissions (admin only)
 */
router.get(
  "/api/rbac/roles",
  verifyToken,
  checkRole(["superadmin", "admin", "committeeoftrustees"]),
  getAllRoles
);

/**
 * GET /api/rbac/roles/:roleName
 * Fetch permissions for a specific role (any authenticated user)
 */
router.get("/api/rbac/roles/:roleName", verifyToken, getRoleByName);

/**
 * PUT /api/rbac/roles/:roleName
 * Update role permissions (superadmin only, no code deploy needed)
 */
router.put(
  "/api/rbac/roles/:roleName",
  verifyToken,
  checkRole(["superadmin"]),
  updatePermissions
);

/**
 * DELETE /api/rbac/roles/:roleName
 * Delete a role (superadmin only, cannot delete superadmin or admin)
 */
router.delete(
  "/api/rbac/roles/:roleName",
  verifyToken,
  checkRole(["superadmin"]),
  deleteRole
);

/**
 * GET /api/rbac/status
 * Check RBAC database status (any authenticated user)
 */
router.get(
  "/api/rbac/status",
  verifyToken,
  getRBACStatus
);

/**
 * POST /api/rbac/seed
 * Manually trigger RBAC seeding (superadmin only)
 */
router.post(
  "/api/rbac/seed",
  verifyToken,
  checkRole(["superadmin"]),
  seedRBACRoles
);

export default router;
