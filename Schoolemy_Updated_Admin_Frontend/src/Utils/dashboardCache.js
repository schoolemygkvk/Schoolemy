

const CACHE_PREFIX = 'dashboard_cache_';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds
let refreshIntervals = {}; // Store interval IDs for cleanup


export const getCachedData = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (parsed.expiresAt && now > parsed.expiresAt) {
      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error(`[Cache] Error reading cache for key "${key}":`, error);
    // If there's an error parsing, remove the corrupted cache
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (e) {
      // Ignore removal errors
    }
    return null;
  }
};


export const setCachedData = (key, data, customDuration = CACHE_DURATION) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const now = Date.now();
    const cacheObject = {
      data,
      timestamp: now,
      expiresAt: now + customDuration,
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
  } catch (error) {
    // If storage is full, try to clear old caches
    if (error.name === 'QuotaExceededError') {
      clearExpiredCaches();
    }
  }
};


export const isCacheValid = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return false;
    }

    const parsed = JSON.parse(cached);
    const now = Date.now();

    if (parsed.expiresAt && now > parsed.expiresAt) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};


export const invalidateCache = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
    console.log(`[Cache] Invalidated cache for key "${key}"`);
    
    // Clear any refresh interval for this key
    if (refreshIntervals[key]) {
      clearInterval(refreshIntervals[key]);
      delete refreshIntervals[key];
    }
  } catch (error) {
    console.error(`[Cache] Error invalidating cache for key "${key}":`, error);
  }
};


export const invalidateAllDashboardCache = () => {
  try {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });

    // Clear all refresh intervals
    Object.keys(refreshIntervals).forEach((key) => {
      clearInterval(refreshIntervals[key]);
    });
    refreshIntervals = {};

    console.log(`[Cache] Invalidated ${clearedCount} dashboard cache entries`);
  } catch (error) {
    console.error('[Cache] Error invalidating all caches:', error);
  }
};

export const clearExpiredCaches = () => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let clearedCount = 0;

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.expiresAt && now > parsed.expiresAt) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          }
        } catch (e) {
          // If parsing fails, remove the corrupted cache
          localStorage.removeItem(key);
          clearedCount++;
        }
      }
    });

    if (clearedCount > 0) {
      console.log(`[Cache] Cleared ${clearedCount} expired cache entries`);
    }
  } catch (error) {
    console.error('[Cache] Error clearing expired caches:', error);
  }
};


export const getCacheMetadata = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);
    return {
      timestamp: parsed.timestamp,
      expiresAt: parsed.expiresAt,
      age: Date.now() - parsed.timestamp,
      timeUntilExpiry: parsed.expiresAt ? parsed.expiresAt - Date.now() : null,
    };
  } catch (error) {
    return null;
  }
};


export const setupAutoRefresh = (key, refreshFunction, intervalMs = CACHE_DURATION) => {
  // Clear existing interval if any
  if (refreshIntervals[key]) {
    clearInterval(refreshIntervals[key]);
  }

  // Setup new interval
  refreshIntervals[key] = setInterval(() => {
    console.log(`[Cache] Auto-refreshing cache for key "${key}"`);
    refreshFunction();
  }, intervalMs);

  console.log(`[Cache] Auto-refresh setup for key "${key}" (every ${intervalMs / 1000 / 60} minutes)`);
};


export const clearAutoRefresh = (key) => {
  if (refreshIntervals[key]) {
    clearInterval(refreshIntervals[key]);
    delete refreshIntervals[key];
    console.log(`[Cache] Cleared auto-refresh for key "${key}"`);
  }
};


export const clearAllAutoRefresh = () => {
  Object.keys(refreshIntervals).forEach((key) => {
    clearInterval(refreshIntervals[key]);
  });
  refreshIntervals = {};
};


export const getAllCacheKeys = () => {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .map((key) => key.replace(CACHE_PREFIX, ''));
  } catch (error) {
    return [];
  }
};

// Cache key constants for easy reference
export const CACHE_KEYS = {
  USERS: 'users',
  COURSES: 'courses',
  TUTORS: 'tutors',
  INSTRUCTORS: 'instructors',
  TUTOR_EARNINGS: 'tutor_earnings',
  TUTOR_COURSES: 'tutor_courses',
  TUTOR_PROFILE: 'tutor_profile',
};

// Initialize: Clear expired caches on module load
if (typeof window !== 'undefined') {
  clearExpiredCaches();
  
  // Clear expired caches every 30 minutes
  setInterval(clearExpiredCaches, 30 * 60 * 1000);
}
