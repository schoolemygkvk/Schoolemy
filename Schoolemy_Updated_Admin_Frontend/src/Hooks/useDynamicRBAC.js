import { useAuth } from "../Components/Auth/AuthProvider";
import { hasAccess, menuAccessRoles } from "../Utils/roleBasedAccess";
import { secureStorage } from "../Utils/security";


export const useDynamicRBAC = () => {
  const auth = useAuth();
  const { user, menuAccess, routeAccess } = auth || {};

  // Same storage as AuthProvider (avoid mismatch with raw localStorage)
  const role =
    user?.role ||
    (typeof window !== "undefined" ? secureStorage.getItem("role") : null);

  if (!role) {
    return {
      role: null,
      hasDynamicPermissions: false,
      canAccessMenu: () => false,
      canAccessRoute: () => false,
      hasRole: () => false,
    };
  }

  // Check if dynamic permissions were loaded from DB
  const hasDynamicMenuAccess = Object.keys(menuAccess || {}).length > 0;
  const hasDynamicRouteAccess = Object.keys(routeAccess || {}).length > 0;
  const hasDynamicPermissions = hasDynamicMenuAccess || hasDynamicRouteAccess;

  const canAccessMenu = (menuKey) => {
    if (!menuKey) return false;

    // If DB permissions are loaded, use them (primary source)
    if (hasDynamicMenuAccess && menuAccess && menuAccess[menuKey] !== undefined) {
      return menuAccess[menuKey] === true;
    }

    // Fallback to hardcoded array (when DB not seeded)
    const allowedRoles = menuAccessRoles[menuKey];
    return hasAccess(role, allowedRoles);
  };

 
  const canAccessRoute = (routeKey, fallbackRoles) => {
    if (!routeKey) return false;

    // If DB permissions are loaded, use them (primary source)
    if (hasDynamicRouteAccess && routeAccess && routeAccess[routeKey] !== undefined) {
      return routeAccess[routeKey] === true;
    }

    // Fallback to hardcoded roles (when DB not seeded)
    if (fallbackRoles && Array.isArray(fallbackRoles)) {
      return hasAccess(role, fallbackRoles);
    }

    return false;
  };


  const hasRole = (roleToCheck) => {
    if (!roleToCheck) return false;
    if (typeof roleToCheck === "string") {
      return role?.toLowerCase() === roleToCheck.toLowerCase();
    }
    if (Array.isArray(roleToCheck)) {
      return roleToCheck.some(
        (r) => role?.toLowerCase() === r.toLowerCase()
      );
    }
    return false;
  };

  return {
    role: role || "guest",  // Default to "guest" if no role found
    hasDynamicPermissions,
    canAccessMenu,
    canAccessRoute,
    hasRole,
    menuAccess: menuAccess || {},
    routeAccess: routeAccess || {},
  };
};

export default useDynamicRBAC;
