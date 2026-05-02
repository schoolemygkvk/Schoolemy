/**
 * Single place for wishlist course-id persistence keys.
 * Fixes: userId missing in localStorage while token exists; guest vs logged-in key mismatch.
 *
 * SECURITY FIX 3.30.1: Uses safe JSON parsing to handle corrupted data properly
 */

import { safeJsonParse } from './safeStorageParser.js';

export function decodeUserIdFromToken() {
  // Tokens are in httpOnly cookies and are intentionally not readable from JavaScript.
  return null;
}

/** Primary key for bookmark IDs: per-user when we know id, else guest bucket. */
export function getWishlistStorageKey() {
  const uid = localStorage.getItem("userId");
  return uid ? `bookmarkedCourses_${uid}` : "bookmarkedCourses";
}

export function readBookmarkIdsFromPrimaryKey() {
  try {
    const raw = localStorage.getItem(getWishlistStorageKey());
    // SECURITY FIX 3.30.1: Safe parse with proper error handling
    const arr = raw ? safeJsonParse(raw, [], getWishlistStorageKey(), 'wishlist bookmarks') : [];
    return [...new Set((Array.isArray(arr) ? arr : []).map(String))].filter(
      Boolean,
    );
  } catch {
    return [];
  }
}

/** Merge every known bookmark list (guest + all suffixed keys) for sync / recovery. */
export function collectAllBookmarkIdsFromStorage() {
  const out = new Set();
  try {
    const g = localStorage.getItem("bookmarkedCourses");
    if (g) {
      // SECURITY FIX 3.30.1: Safe parse with error handling
      const arr = safeJsonParse(g, [], "bookmarkedCourses", 'guest wishlist bookmarks');
      if (Array.isArray(arr)) arr.forEach((x) => out.add(String(x)));
    }
  } catch {}
  const uid = localStorage.getItem("userId");
  if (uid) {
    try {
      const raw = localStorage.getItem(`bookmarkedCourses_${uid}`);
      if (raw) {
        // SECURITY FIX 3.30.1: Safe parse with error handling
        const arr = safeJsonParse(raw, [], `bookmarkedCourses_${uid}`, 'user wishlist bookmarks');
        if (Array.isArray(arr)) arr.forEach((x) => out.add(String(x)));
      }
    } catch {}
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("bookmarkedCourses_")) continue;
      // SECURITY FIX 3.30.1: Safe parse with error handling
      const arr = safeJsonParse(localStorage.getItem(k) || "[]", [], k, `wishlist bookmarks for ${k}`);
      if (Array.isArray(arr)) arr.forEach((x) => out.add(String(x)));
    }
  } catch {}
  return [...out].filter(Boolean);
}

export function writeBookmarkIdsToPrimaryKey(ids) {
  const key = getWishlistStorageKey();
  try {
    localStorage.setItem(
      key,
      JSON.stringify([...new Set((ids || []).map(String))].filter(Boolean)),
    );
  } catch (e) {
    console.warn("wishlistStorage: write failed", e);
  }
}

/** After login: move guest bookmarks into the user-scoped key. */
export function migrateGuestWishlistToUser(userIdStr) {
  if (userIdStr == null) return;
  try {
    const uid = String(userIdStr);
    const guestRaw = localStorage.getItem("bookmarkedCourses");
    // SECURITY FIX 3.30.1: Safe parse with error handling
    const guest = guestRaw ? safeJsonParse(guestRaw, [], "bookmarkedCourses", 'guest wishlist during migration') : [];
    if (!Array.isArray(guest) || guest.length === 0) return;
    const key = `bookmarkedCourses_${uid}`;
    let existing = [];
    try {
      // SECURITY FIX 3.30.1: Safe parse with error handling
      existing = safeJsonParse(localStorage.getItem(key) || "[]", [], key, 'user wishlist during migration');
    } catch {
      existing = [];
    }
    const merged = [
      ...new Set(
        [...(Array.isArray(existing) ? existing : []), ...guest].map(String),
      ),
    ].filter(Boolean);
    localStorage.setItem(key, JSON.stringify(merged));
    localStorage.removeItem("bookmarkedCourses");
  } catch (e) {
    console.warn("wishlistStorage: guest migrate skipped", e);
  }
}
