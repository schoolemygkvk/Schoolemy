

import sanitizeHtml from "sanitize-html";
import xss from "xss";
import logger from "./logger.js";


export const sanitizeHtmlContent = (dirty, options = {}) => {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  // Default: remove all HTML (strictest)
  const defaultOptions = {
    allowedTags: [], // No tags allowed
    allowedAttributes: {},
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
  };

  // Merge with custom options
  const finalOptions = { ...defaultOptions, ...options };

  try {
    return sanitizeHtml(dirty, finalOptions);
  } catch (error) {
    logger.warn("HTML sanitization error", { error: error.message });
    return ""; // Return empty string on error
  }
};


export const sanitizeText = (text) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Use xss library to remove all HTML/script
  return xss(text, {
    whiteList: {}, // No HTML allowed
    stripIgnoredTag: true,
    stripLeadingAndTrailingWhitespace: true,
  });
};


export const sanitizeUserProfile = (data) => {
  if (!data || typeof data !== "object") {
    return {};
  }

  return {
    name: sanitizeText(data.name),
    email: sanitizeEmail(data.email),
    phone: sanitizePhone(data.phone),
    bio: sanitizeText(data.bio),
    ...(data.profilePicture && { profilePicture: sanitizeUrl(data.profilePicture) }),
  };
};


export const sanitizeCourseContent = (content) => {
  if (!content || typeof content !== "object") {
    return {};
  }

  return {
    title: sanitizeText(content.title),
    description: sanitizeText(content.description),
    ...(content.content && { content: sanitizeText(content.content) }),
    ...(content.lessonTitle && { lessonTitle: sanitizeText(content.lessonTitle) }),
    ...(content.lessonDescription && { lessonDescription: sanitizeText(content.lessonDescription) }),
  };
};


export const sanitizeEmail = (email) => {
  if (!email || typeof email !== "string") {
    return "";
  }

  // Remove null bytes, control characters
  return email
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .toLowerCase();
};


export const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return "";
  }

  // Keep only digits, +, -, (), spaces
  return phone.replace(/[^\d+\-() ]/g, "").trim();
};


export const sanitizeUrl = (url) => {
  if (!url || typeof url !== "string") {
    return "";
  }

  try {
    // Parse URL to validate it
    const parsed = new URL(url);

    // Only allow http, https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      logger.warn("Invalid URL protocol", { url, protocol: parsed.protocol });
      return "";
    }

    return parsed.toString();
  } catch (error) {
    // Invalid URL
    logger.warn("URL sanitization failed", { url, error: error.message });
    return "";
  }
};


export const sanitizeFilePath = (filePath) => {
  if (!filePath || typeof filePath !== "string") {
    return "";
  }

  // Get basename only (prevents ../ traversal)
  const basename = filePath.split(/[\\/]/).pop();

  // Remove dangerous characters
  return basename.replace(/[<>:"|?*\x00-\x1F]/g, "");
};


export const sanitizeSearchQuery = (query) => {
  if (!query || typeof query !== "string") {
    return "";
  }

  // Remove null bytes and control characters
  return query
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .slice(0, 200); // Limit length
};


export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const sanitized = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      // Remove keys with $ (MongoDB operators)
      if (key.startsWith("$")) {
        logger.warn("Suspicious MongoDB operator in object", { key });
        continue;
      }

      // Recursively sanitize nested objects
      if (typeof value === "object" && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else if (typeof value === "string") {
        sanitized[key] = sanitizeText(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};


export const sanitizeJson = (jsonString) => {
  if (!jsonString || typeof jsonString !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return sanitizeObject(parsed);
  } catch (error) {
    logger.warn("JSON sanitization failed", { error: error.message });
    return null;
  }
};


export const sanitizeFormData = (formData, fieldOptions = {}) => {
  if (!formData || typeof formData !== "object") {
    return {};
  }

  const sanitized = {};

  for (const key in formData) {
    if (formData.hasOwnProperty(key)) {
      const value = formData[key];
      const options = fieldOptions[key];

      // Apply field-specific sanitization
      if (options?.type === "email") {
        sanitized[key] = sanitizeEmail(value);
      } else if (options?.type === "phone") {
        sanitized[key] = sanitizePhone(value);
      } else if (options?.type === "url") {
        sanitized[key] = sanitizeUrl(value);
      } else if (options?.type === "html") {
        sanitized[key] = sanitizeHtmlContent(value, options.htmlOptions);
      } else if (typeof value === "string") {
        sanitized[key] = sanitizeText(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};


export const validateAndSanitize = (input, type = "text") => {
  if (input === null || input === undefined) {
    return { valid: false, value: "", error: "Input is required" };
  }

  if (typeof input !== "string") {
    return { valid: false, value: "", error: "Input must be a string" };
  }

  try {
    switch (type) {
    case "email": {
      const sanitized = sanitizeEmail(input);
      // Basic email regex
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized);
      return { valid: isValid, value: sanitized, error: isValid ? undefined : "Invalid email format" };
    }

    case "phone": {
      const sanitized = sanitizePhone(input);
      const isValid = /^[\d+\-() ]+$/.test(sanitized) && sanitized.replace(/\D/g, "").length >= 10;
      return { valid: isValid, value: sanitized, error: isValid ? undefined : "Invalid phone format" };
    }

    case "url": {
      const sanitized = sanitizeUrl(input);
      const isValid = sanitized.length > 0;
      return { valid: isValid, value: sanitized, error: isValid ? undefined : "Invalid URL" };
    }

    case "html": {
      const sanitized = sanitizeHtmlContent(input);
      return { valid: true, value: sanitized };
    }

    default: {
      const sanitized = sanitizeText(input);
      return { valid: true, value: sanitized };
    }
    }
  } catch (error) {
    logger.error("Validation and sanitization error", { type, error: error.message });
    return { valid: false, value: "", error: "Sanitization failed" };
  }
};

export default {
  sanitizeHtmlContent,
  sanitizeText,
  sanitizeUserProfile,
  sanitizeCourseContent,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeFilePath,
  sanitizeSearchQuery,
  sanitizeObject,
  sanitizeJson,
  sanitizeFormData,
  validateAndSanitize,
};
