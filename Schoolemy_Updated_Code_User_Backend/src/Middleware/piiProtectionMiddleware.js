import logger from "../Utils/logger.js";


export const piiProtectionMiddleware = (req, res, next) => {
  // Store original res.json to intercept responses
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    // SECURITY FIX 3.42.1: Strip PII from response
    const protectedData = stripPIIFromResponse(data);

    // Log PII access attempts (for audit trail)
    if (containsPII(data)) {
      logger.warn("[PII_PROTECTION] Attempted to expose PII:", {
        endpoint: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        userId: req.userId || "anonymous",
      });
    }

    return originalJson(protectedData);
  };

  next();
};

export function stripPIIFromResponse(data) {
  // PII fields to remove
  const piiFields = [
    // Staff/User PII fields
    "aadharNumber",  // Critical: 12-digit Indian ID number
    "age",           // Sensitive: calculated from dateofBirth
    "address",       // Sensitive: home/residential address
    "joinDate",      // Semi-sensitive: account creation timestamp
    "date",          // Semi-sensitive: creation/update timestamp
    "fatherName",    // Sensitive: family information
    "dateofBirth",   // Sensitive: personal date
    "bloodGroup",    // Sensitive: medical information
    "Nationality",   // Sensitive: citizenship/national data
    "Occupation",    // Sensitive: employment/profession information
    "loginHistory",  // Sensitive: IP addresses and user agents
    "password",      // CRITICAL: should never be exposed
  ];

  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => stripPIIFromResponse(item));
  }

  // Handle objects
  if (typeof data === "object") {
    const cleaned = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip PII fields
      if (piiFields.includes(key)) {
        logger.warn(`[PII_PROTECTION] Stripped PII field: ${key}`);
        continue;
      }

      // Recursively clean nested objects/arrays
      if (typeof value === "object") {
        cleaned[key] = stripPIIFromResponse(value);
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  // Return primitives as-is
  return data;
}

export function containsPII(data) {
  const piiFields = [
    // Staff/User PII fields
    "aadharNumber",  // Critical: 12-digit Indian ID number
    "age",           // Sensitive: calculated from dateofBirth
    "address",       // Sensitive: home/residential address
    "joinDate",      // Semi-sensitive: account creation timestamp
    "date",          // Semi-sensitive: creation/update timestamp
    "fatherName",    // Sensitive: family information
    "dateofBirth",   // Sensitive: personal date
    "bloodGroup",    // Sensitive: medical information
    "Nationality",   // Sensitive: citizenship/national data
    "Occupation",    // Sensitive: employment/profession information
    "loginHistory",  // Sensitive: IP addresses and user agents
    "password",      // CRITICAL: should never be exposed
  ];

  if (!data || typeof data !== "object") {
    return false;
  }

  // Check array
  if (Array.isArray(data)) {
    return data.some(item => containsPII(item));
  }

  // Check object
  for (const key of Object.keys(data)) {
    if (piiFields.includes(key)) {
      return true;
    }

    // Recursively check nested objects
    if (typeof data[key] === "object" && data[key] !== null) {
      if (containsPII(data[key])) {
        return true;
      }
    }
  }

  return false;
}


export function buildSafeStaffResponse(staffDocument) {
  if (!staffDocument) {
    return null;
  }

  // Convert to object if it's a Mongoose document
  const staff = staffDocument.toObject ? staffDocument.toObject() : staffDocument;

  // SECURITY FIX 3.42.1: Only include safe fields
  return {
    _id: staff._id,
    name: staff.name,
    designation: staff.designation,
    gender: staff.gender,  // Already public, kept for completeness
    profilePicture: staff.profilePicture,
    // REMOVED: aadharNumber (critical PII)
    // REMOVED: age (privacy)
    // REMOVED: address (privacy)
    // REMOVED: date (privacy)
  };
}


export function buildSafeStaffListResponse(staffDocuments) {
  if (!Array.isArray(staffDocuments)) {
    return [];
  }

  return staffDocuments.map(doc => buildSafeStaffResponse(doc));
}


export function validateNoPII(data) {
  if (containsPII(data)) {
    throw new Error(
      "SECURITY VIOLATION: Response contains PII fields. " +
      "Use buildSafeStaffResponse() or .select() to exclude sensitive fields.",
    );
  }
}

export default {
  piiProtectionMiddleware,
  stripPIIFromResponse,
  containsPII,
  buildSafeStaffResponse,
  buildSafeStaffListResponse,
  validateNoPII,
};
