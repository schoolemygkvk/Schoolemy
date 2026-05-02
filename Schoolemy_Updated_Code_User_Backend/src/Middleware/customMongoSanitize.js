

const FORBIDDEN_CHARS = /^[$.]|\.\$|^\$/;


function sanitizeObject(obj, path = "") {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) =>
      sanitizeObject(item, `${path}[${index}]`),
    );
  }

  const sanitized = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Check if key contains forbidden characters
      if (FORBIDDEN_CHARS.test(key)) {
        const newKey = key.replace(/^\$+|^\$+|\.\$/g, "_");
        console.warn(
          `[Security] MongoDB injection attempt detected: "${key}" → "${newKey}" at ${path}.${key}`,
        );
        sanitized[newKey] = sanitizeObject(obj[key], `${path}.${key}`);
      } else {
        sanitized[key] = sanitizeObject(obj[key], `${path}.${key}`);
      }
    }
  }

  return sanitized;
}


export default function customMongoSanitize(options = {}) {
  return (req, res, next) => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === "object") {
        req.body = sanitizeObject(req.body, "req.body");
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === "object") {
        req.params = sanitizeObject(req.params, "req.params");
      }

      // Note: req.query is read-only in Express 5.x, so we cannot sanitize it here
      // If you need to sanitize query parameters, do it at the route level or use
      // express-validator with custom sanitization rules

      next();
    } catch (error) {
      console.error("[Sanitization Error]", error.message);
      next(); // Continue even if sanitization fails
    }
  };
}
