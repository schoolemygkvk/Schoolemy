/**
 * UTF-8 Helper Utility
 * Fixes corrupted UTF-8 Tamil text that was stored as Latin1
 */

/**
 * Safely decode Latin1-encoded Tamil text back to UTF-8
 * This handles cases where UTF-8 text was incorrectly stored as Latin1
 * 
 * @param {string} text - Potentially corrupted text
 * @returns {string} - Properly decoded UTF-8 text
 */
export const decodeUtf8Text = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  try {
    // Check if text is already corrupted (contains Latin1 encoded UTF-8)
    // Tamil characters in UTF-8 encoded as Latin1 look like: à®¨à®©à¯
    if (/[\xC0-\xFF]/.test(text)) {
      // Convert Latin1 string to buffer, then decode as UTF-8
      const buffer = Buffer.from(text, 'latin1');
      const decoded = buffer.toString('utf-8');
      
      // Verify the decode worked (should have Tamil Unicode range)
      if (/[\u0B80-\u0BFF]/.test(decoded)) {
        console.log(`Decoded: "${text}" -> "${decoded}"`);
        return decoded;
      }
    }
    
    // Text is already correct UTF-8
    return text;
  } catch (error) {
    console.error('Error decoding UTF-8:', error);
    return text; // Return original if decode fails
  }
};

/**
 * Recursively fix UTF-8 encoding in an object
 * @param {any} obj - Object to fix
 * @returns {any} - Fixed object
 */
export const fixUtf8InObject = (obj) => {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return decodeUtf8Text(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => fixUtf8InObject(item));
  }
  
  if (typeof obj === 'object') {
    const fixed = {};
    for (const key in obj) {
      fixed[key] = fixUtf8InObject(obj[key]);
    }
    return fixed;
  }
  
  return obj;
};

export default { decodeUtf8Text, fixUtf8InObject };
