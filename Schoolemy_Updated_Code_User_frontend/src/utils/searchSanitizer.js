import DOMPurify from 'dompurify';

/**
 * searchSanitizer.js - SECURITY FIX 3.40.1
 * Search input validation and sanitization utilities
 *
 * SECURITY FIX 3.40.1: Search Input Sanitization
 * - Prevents reflected XSS attacks via search parameters
 * - Sanitizes search terms before displaying to users
 * - Validates search input length and format
 * - Prevents malicious HTML/JavaScript injection
 *
 * CRITICAL RULE:
 * NEVER display user-provided search input directly in the DOM
 * ALWAYS sanitize with DOMPurify before display
 * Use textContent instead of innerHTML
 * Validate input length (max 500 characters)
 *
 * Security Principles:
 * 1. Search input comes from user (untrusted)
 * 2. Search term is sanitized before display
 * 3. Sanitization removes HTML/scripts
 * 4. Display uses textContent (text-only, never HTML)
 * 5. Search results validate/sanitize data from server
 */

/**
 * SECURITY FIX 3.40.1: Sanitize search input
 *
 * Removes potentially malicious HTML/JavaScript from search terms
 * Uses DOMPurify to safely strip dangerous elements
 *
 * @param {string} searchTerm - Raw search input from user
 * @returns {string} - Sanitized search term safe for display
 */
export function sanitizeSearchInput(searchTerm) {
  // Validate input is a string
  if (typeof searchTerm !== 'string') {
    console.warn('SECURITY: Non-string search input provided');
    return '';
  }

  // SECURITY FIX 3.40.1: Validate search length (prevent abuse)
  const MAX_SEARCH_LENGTH = 500;
  if (searchTerm.length > MAX_SEARCH_LENGTH) {
    console.warn(`SECURITY: Search input exceeds max length (${MAX_SEARCH_LENGTH} chars)`);
    return searchTerm.substring(0, MAX_SEARCH_LENGTH);
  }

  // SECURITY FIX 3.40.1: Use DOMPurify to strip dangerous content
  // Config: ALLOWED_TAGS=[] means NO HTML tags are allowed, only text
  const sanitized = DOMPurify.sanitize(searchTerm, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No HTML attributes allowed
    KEEP_CONTENT: true, // Keep the text content
  });

  return sanitized;
}

/**
 * SECURITY FIX 3.40.1: Validate search input format
 *
 * Ensures search input is valid and doesn't contain problematic patterns
 *
 * @param {string} searchTerm - Search input to validate
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export function validateSearchInput(searchTerm) {
  const errors = [];

  // Check if input is a string
  if (typeof searchTerm !== 'string') {
    errors.push('Search term must be a string');
    return { isValid: false, errors };
  }

  // Check maximum length
  const MAX_SEARCH_LENGTH = 500;
  if (searchTerm.length > MAX_SEARCH_LENGTH) {
    errors.push(`Search term exceeds maximum length of ${MAX_SEARCH_LENGTH} characters`);
  }

  // Check for dangerous patterns (scripts, iframes, event handlers)
  const dangerousPatterns = [
    /<script/i,
    /<iframe/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /javascript:/i,
    /data:text\/html/i,
    /<svg/i, // SVG can contain scripts
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(searchTerm)) {
      errors.push('Search term contains potentially malicious content');
      break;
    }
  }

  // Check if search term is empty (after trimming)
  if (searchTerm.trim().length === 0 && searchTerm.length > 0) {
    errors.push('Search term cannot be only whitespace');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * SECURITY FIX 3.40.1: Get display-safe search text
 *
 * Returns sanitized search term for safe display in UI
 * IMPORTANT: Use this for displaying search terms, not for API queries
 *
 * @param {string} searchTerm - Raw search input
 * @returns {string} - Safe to display with textContent or as React child
 */
export function getSafeSearchDisplay(searchTerm) {
  // First validate
  const validation = validateSearchInput(searchTerm);
  if (!validation.isValid) {
    console.warn('SECURITY: Invalid search input detected:', validation.errors);
    return ''; // Return empty string for invalid input
  }

  // Then sanitize
  const sanitized = sanitizeSearchInput(searchTerm);
  return sanitized;
}

/**
 * SECURITY FIX 3.40.1: Log search for analytics (safe version)
 *
 * Logs sanitized search terms for analytics/debugging
 * Never logs raw user input directly
 *
 * @param {string} rawSearchTerm - Raw search input
 * @param {object} context - Additional context (results count, timestamp, etc.)
 */
export function logSearchActivity(rawSearchTerm, context = {}) {
  // Always sanitize before logging
  const sanitized = sanitizeSearchInput(rawSearchTerm);

  console.log('[SearchActivity]', {
    searchTerm: sanitized, // Only log sanitized version
    length: sanitized.length,
    timestamp: new Date().toISOString(),
    ...context,
  });

  // In production, you might send this to a logging service
  // But only the sanitized version
}

/**
 * SECURITY FIX 3.40.1: Sanitize search results from server
 *
 * Ensures data returned from search API is safe to display
 * Even server-provided content should be validated
 *
 * @param {array} results - Search results from API
 * @returns {array} - Sanitized results safe for display
 */
export function sanitizeSearchResults(results) {
  if (!Array.isArray(results)) {
    console.warn('SECURITY: Search results are not an array');
    return [];
  }

  return results.map((result) => {
    // Sanitize string fields that might be displayed
    const sanitized = { ...result };

    // Common fields that might contain user input
    const fieldsToSanitize = ['title', 'description', 'excerpt', 'content', 'name'];

    fieldsToSanitize.forEach((field) => {
      if (typeof sanitized[field] === 'string') {
        sanitized[field] = sanitizeSearchInput(sanitized[field]);
      }
    });

    return sanitized;
  });
}

export default {
  sanitizeSearchInput,
  validateSearchInput,
  getSafeSearchDisplay,
  logSearchActivity,
  sanitizeSearchResults,
};
