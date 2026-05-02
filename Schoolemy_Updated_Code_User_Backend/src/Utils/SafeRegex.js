

import logger from "./logger.js";


export const escapeRegexChars = (str) => {
  if (typeof str !== "string") {
    throw new TypeError("Input must be a string");
  }
  // Escape all regex special characters: . * + ? ^ $ { } ( ) | [ ] \
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


export const validateRegexInput = (input, maxLength = 100) => {
  if (!input || typeof input !== "string") {
    return { valid: false, error: "Input must be a non-empty string" };
  }

  if (input.length > maxLength) {
    return {
      valid: false,
      error: `Input exceeds maximum length of ${maxLength} characters`,
    };
  }

  return { valid: true };
};


export const safeStringSearch = (haystack, needle, caseInsensitive = false) => {
  if (!haystack || !needle) return false;

  if (caseInsensitive) {
    return haystack.toLowerCase().includes(needle.toLowerCase());
  }

  return haystack.includes(needle);
};


export const safeRegexTest = (text, regex, timeoutMs = 100) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Regex operation exceeded ${timeoutMs}ms timeout`));
    }, timeoutMs);

    try {
      const result = regex.test(text);
      clearTimeout(timer);
      resolve(result);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
};


export const safeCaseInsensitiveSearch = (searchText, targetText) => {
  // Validate inputs
  const validation = validateRegexInput(searchText, 100);
  if (!validation.valid) {
    logger.warn("Search validation failed:", validation.error);
    return false;
  }

  if (!targetText || typeof targetText !== "string") {
    return false;
  }

  // Use .includes() - much safer than regex
  return targetText.toLowerCase().includes(searchText.toLowerCase());
};


export const createSafeRegex = (userInput, flags = "i") => {
  // Validate input
  const validation = validateRegexInput(userInput, 100);
  if (!validation.valid) {
    logger.warn("Regex validation failed:", validation.error);
    return null;
  }

  // Escape all regex special characters
  const escapedInput = escapeRegexChars(userInput);

  try {
    return new RegExp(escapedInput, flags);
  } catch (error) {
    logger.error("Failed to create regex:", error);
    return null;
  }
};


export const safeSearchArray = (items, searchTerm, fieldName) => {
  if (!Array.isArray(items) || !searchTerm || !fieldName) {
    return [];
  }

  // Validate search term length
  const validation = validateRegexInput(searchTerm, 100);
  if (!validation.valid) {
    logger.warn("Search term validation failed:", validation.error);
    return [];
  }

  // Use simple string matching instead of regex
  const lowerSearchTerm = searchTerm.toLowerCase();
  return items.filter((item) => {
    const fieldValue = item[fieldName];
    if (!fieldValue || typeof fieldValue !== "string") return false;
    return fieldValue.toLowerCase().includes(lowerSearchTerm);
  });
};

export default {
  escapeRegexChars,
  validateRegexInput,
  safeStringSearch,
  safeRegexTest,
  safeCaseInsensitiveSearch,
  createSafeRegex,
  safeSearchArray,
};
