/**
 * Auto-seed RBAC roles if collection is empty
 * Called on server startup to ensure roles exist
 */

import RolePermission from "../Models/RBAC/RolePermission.js";
import { roleDefinitions } from "../config/rbacRoleDefinitions.js";

export const autoSeedRBAC = async () => {
  try {
    const count = await RolePermission.countDocuments();

    if (count === 0) {

      for (const role of roleDefinitions) {
        await RolePermission.findOneAndUpdate(
          { roleName: role.roleName },
          {
            $set: {
              displayName: role.displayName,
              hierarchy: role.hierarchy,
              menuAccess: role.menuAccess,
              routeAccess: role.routeAccess,
              isActive: true,
            },
          },
          { upsert: true, new: true }
        );

      }

      return { seeded: true, count: roleDefinitions.length };
    } else {
      return { seeded: false, count };
    }
  } catch (error) {
    console.error("Auto-seed failed:", error.message);
    throw error;
  }
};
