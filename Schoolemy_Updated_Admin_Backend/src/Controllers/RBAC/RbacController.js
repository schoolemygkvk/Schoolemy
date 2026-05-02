import RolePermission from "../../Models/RBAC/RolePermission.js";
import { sendSuccess, sendError } from "../../Utils/responseHandler.js";
import { DEFAULT_RBAC_ROLE_METADATA, getCatalogMeta } from "../../config/rbacRoleCatalog.js";
import { getRoleSeedDefinition, mergePermissionMaps, roleDefinitions } from "../../config/rbacRoleDefinitions.js";


export const getAllRoles = async (req, res) => {
  try {
    const dbRoles = await RolePermission.find({}).sort({ hierarchy: -1 }).lean();
    const byName = new Map(dbRoles.map((r) => [r.roleName, r]));

    for (const meta of DEFAULT_RBAC_ROLE_METADATA) {
      if (!byName.has(meta.roleName)) {
        byName.set(meta.roleName, {
          roleName: meta.roleName,
          displayName: meta.displayName,
          hierarchy: meta.hierarchy,
          menuAccess: {},
          routeAccess: {},
          isActive: true,
        });
      }
    }

    const roles = [...byName.values()].sort((a, b) => b.hierarchy - a.hierarchy);

    return sendSuccess(res, 200, "Roles retrieved successfully", { roles });
  } catch (error) {
    return sendError(res, 500, "Failed to retrieve roles", error.message);
  }
};


export const getRoleByName = async (req, res) => {
  try {
    const { roleName } = req.params;

    if (!roleName || typeof roleName !== "string") {
      return sendError(res, 400, "Invalid role name", "roleName is required");
    }

    const key = roleName.toLowerCase();
    let role = await RolePermission.findOne({ roleName: key }).lean();

    if (!role) {
      const meta = getCatalogMeta(key);
      if (meta) {
        role = {
          roleName: meta.roleName,
          displayName: meta.displayName,
          hierarchy: meta.hierarchy,
          menuAccess: {},
          routeAccess: {},
          isActive: true,
        };
      }
    }

    if (!role) {
      return sendError(res, 404, "Role not found", `Role '${roleName}' does not exist`);
    }

    const seed = getRoleSeedDefinition(key);
    if (seed) {
      role = {
        ...role,
        menuAccess: mergePermissionMaps(seed.menuAccess, role.menuAccess),
        routeAccess: mergePermissionMaps(seed.routeAccess, role.routeAccess),
      };
    }

    return sendSuccess(res, 200, "Role retrieved successfully", { role });
  } catch (error) {
    return sendError(res, 500, "Failed to retrieve role", error.message);
  }
};


export const createRole = async (req, res) => {
  try {
    const { roleName, displayName, hierarchy } = req.body;

    if (!roleName || typeof roleName !== "string" || roleName.trim() === "") {
      return sendError(res, 400, "Invalid role name", "roleName is required and must be a non-empty string");
    }

    if (!displayName || typeof displayName !== "string" || displayName.trim() === "") {
      return sendError(res, 400, "Invalid display name", "displayName is required");
    }

    if (hierarchy === undefined || typeof hierarchy !== "number" || hierarchy < 1 || hierarchy > 100) {
      return sendError(res, 400, "Invalid hierarchy", "hierarchy must be a number between 1 and 100");
    }

    const existingRole = await RolePermission.findOne({
      roleName: roleName.toLowerCase(),
    });

    if (existingRole) {
      return sendError(res, 409, "Role already exists", `Role '${roleName}' already exists`);
    }

    const newRole = new RolePermission({
      roleName: roleName.toLowerCase(),
      displayName,
      hierarchy,
      menuAccess: {},
      routeAccess: {},
      isActive: true,
    });

    await newRole.save();

    return sendSuccess(res, 201, "Role created successfully", { role: newRole });
  } catch (error) {
    return sendError(res, 500, "Failed to create role", error.message);
  }
};


export const updatePermissions = async (req, res) => {
  try {
    const { roleName } = req.params;
    const { menuAccess, routeAccess, displayName, hierarchy } = req.body;

    if (!roleName || typeof roleName !== "string") {
      return sendError(res, 400, "Invalid role name", "roleName is required");
    }

    // Build update object with only provided fields
    const updateData = {};
    if (menuAccess !== undefined) updateData.menuAccess = menuAccess;
    if (routeAccess !== undefined) updateData.routeAccess = routeAccess;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (hierarchy !== undefined) updateData.hierarchy = hierarchy;

    if (Object.keys(updateData).length === 0) {
      return sendError(res, 400, "No fields to update", "Provide at least one field");
    }

    const key = roleName.toLowerCase();
    const meta = getCatalogMeta(key);
    const setOnInsert = {
      roleName: key,
      displayName: meta?.displayName || key,
      hierarchy: meta?.hierarchy ?? 50,
      menuAccess: {},
      routeAccess: {},
      isActive: true,
    };


    // First, check if role exists
    const existingRole = await RolePermission.findOne({ roleName: key });

    if (!existingRole) {
      console.error("Role not found for update");
      return sendError(res, 404, "Role not found", `Cannot update non-existent role '${roleName}'`);
    }

    // Perform simple update on existing role (no upsert)
    const role = await RolePermission.findOneAndUpdate(
      { roleName: key },
      { $set: updateData },
      { new: true }
    );


    if (!role) {
      console.error("Role update returned null");
      return sendError(res, 500, "Failed to update role permissions", "Update operation returned null");
    }

    return sendSuccess(res, 200, "Role permissions updated successfully", { role });
  } catch (error) {
    console.error("updatePermissions error caught");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const details = Object.values(error.errors || {})
        .map((e) => e.message)
        .join("; ");
      console.error("Validation error details:", details);
      return sendError(res, 400, "Validation failed", details);
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      console.error("Duplicate key error");
      return sendError(res, 409, "Role already exists", error.message);
    }

    console.error("Generic error response being sent");
    return sendError(res, 500, "Failed to update role permissions", error.message);
  }
};


export const seedRBACRoles = async (req, res) => {
  try {

    const seededRoles = [];
    for (const role of roleDefinitions) {
      const result = await RolePermission.findOneAndUpdate(
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

      seededRoles.push(result);
    }

    return sendSuccess(res, 200, "RBAC roles seeded successfully", {
      count: seededRoles.length,
      roles: seededRoles,
    });
  } catch (error) {
    console.error("\nSeed error:", error.message);
    return sendError(res, 500, "Failed to seed RBAC roles", error.message);
  }
};


export const deleteRole = async (req, res) => {
  try {
    const { roleName } = req.params;
    const key = roleName.toLowerCase();


    // Protect built-in roles from deletion
    const PROTECTED_ROLES = ["superadmin", "admin"];
    if (PROTECTED_ROLES.includes(key)) {
      console.error("Attempt to delete protected role:", key);
      return sendError(
        res,
        403,
        "Cannot delete protected role",
        `'${key}' is a built-in role and cannot be deleted`
      );
    }

    const deleted = await RolePermission.findOneAndDelete({ roleName: key });

    if (!deleted) {
      console.error("Role not found:", key);
      return sendError(res, 404, "Role not found", `Role '${roleName}' does not exist`);
    }

    return sendSuccess(res, 200, "Role deleted successfully", { roleName: key });
  } catch (error) {
    return sendError(res, 500, "Failed to delete role", error.message);
  }
};


export const getRBACStatus = async (req, res) => {
  try {
    const dbRoles = await RolePermission.find({}).select("roleName displayName hierarchy").lean();
    const dbRoleNames = new Set(dbRoles.map((r) => r.roleName));

    const missing = DEFAULT_RBAC_ROLE_METADATA.filter(
      (meta) => !dbRoleNames.has(meta.roleName)
    );

    return sendSuccess(res, 200, "RBAC status", {
      totalInDB: dbRoles.length,
      totalExpected: DEFAULT_RBAC_ROLE_METADATA.length,
      rolesInDB: dbRoles,
      missingRoles: missing,
      isFullySeeded: missing.length === 0,
    });
  } catch (error) {
    console.error("getRBACStatus error:", error.message);
    return sendError(res, 500, "Failed to get RBAC status", error.message);
  }
};
