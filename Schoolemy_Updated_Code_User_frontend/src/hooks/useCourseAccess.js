import { useCallback } from "react";
import { useAuth } from "../Context/AuthContext";
import api from "../service/api"; // SECURITY FIX 3.19.1: Import API for server verification

/**
 * Custom hook for course access control
 * SECURITY FIX 3.19.1: All access control decisions MUST be verified by the server
 * The access levels used here come from server responses and should NEVER be:
 * - Stored in localStorage without server verification
 * - Cached without expiry
 * - Used to skip server requests
 * - Determined by client-side data that can be manipulated
 *
 * Centralizes authorization logic for consistent access checks
 * Supports role-based access control (RBAC)
 */
export const useCourseAccess = () => {
  const { userData, isLoggedIn } = useAuth();

  /**
   * Check if user has access to a course based on enrollment status
   * SECURITY FIX 3.19.1: The 'access' parameter MUST come from server response
   * DO NOT use client-side data like localStorage or location.state for payment status
   * @param {string} access - Access level from server response ("limited", "purchased", "enrolled", "full", "completed")
   * @returns {boolean} True if user has any form of access
   */
  const hasAccess = useCallback(
    (access) => {
      if (!isLoggedIn) return false;
      // SECURITY: Only trust access levels from server, not from client storage
      return (
        access === "full" ||
        access === "purchased" ||
        access === "enrolled" ||
        access === "completed"
      );
    },
    [isLoggedIn]
  );

  /**
   * Check if user has full access (can view all content)
   * @param {string} access - Access level from course data
   * @returns {boolean} True if user has full access
   */
  const hasFullAccess = useCallback((access) => {
    return access === "full" || access === "completed";
  }, []);

  /**
   * Check if user is enrolled in course
   * @param {string} access - Access level from course data
   * @returns {boolean} True if user is enrolled
   */
  const isEnrolled = useCallback((access) => {
    return (
      access === "enrolled" ||
      access === "full" ||
      access === "purchased" ||
      access === "completed"
    );
  }, []);

  /**
   * Check if user has purchased/paid for course
   * SECURITY FIX 3.19.1: Payment status MUST be verified by server
   * Never trust localStorage.paymentStatus or location.state.paymentCompleted for access control
   * Always fetch the latest access level from server: GET /api/course/{id}
   * @param {string} access - Access level from server response only
   * @returns {boolean} True if user has purchased
   */
  const hasPurchased = useCallback((access) => {
    // SECURITY: Only accept server-provided access levels
    return access === "purchased" || access === "full" || access === "completed";
  }, []);

  /**
   * SECURITY FIX 3.32.1: Check if user is instructor/tutor
   * For UI purposes only - server must verify for actual operations
   * @returns {boolean} True if user is instructor (UI purposes)
   */
  const isInstructor = useCallback(() => {
    const { hasInstructorRole } = require('../utils/permissionManager');
    return hasInstructorRole(userData);
  }, [userData]);

  /**
   * SECURITY FIX 3.32.1: Check if user is admin
   * For UI purposes only - server must verify for actual operations
   * @returns {boolean} True if user is admin (UI purposes)
   */
  const isAdmin = useCallback(() => {
    const { hasAdminRole } = require('../utils/permissionManager');
    return hasAdminRole(userData);
  }, [userData]);

  /**
   * Get access description for UI display
   * @param {string} access - Access level from course data
   * @returns {string} Human-readable access description
   */
  const getAccessDescription = useCallback((access) => {
    const descriptions = {
      limited: "Preview Only",
      purchased: "Access Restricted - Complete Payment",
      enrolled: "Enrolled - Full Access",
      full: "Full Access",
      completed: "Completed",
    };
    return descriptions[access] || "No Access";
  }, []);

  /**
   * SECURITY FIX 3.19.1: Verify payment with server
   * This is the ONLY way to check if a user can access paid content
   * It queries the server database, not client-side data
   * @param {string} courseId - Course ID to verify access for
   * @returns {Promise<boolean>} True only if server confirms access
   */
  const verifyServerPayment = useCallback(async (courseId) => {
    try {
      // Uses course detail API (aligned with GET /api/v1/courses/:id/content)
      const response = await api.get(`/api/v1/courses/${courseId}`);
      const body = response.data || {};
      const access = body.access || "limited";
      return (
        access === "full" ||
        access === "completed" ||
        access === "purchased" ||
        access === "enrolled"
      );
    } catch (error) {
      console.error("Payment verification failed:", error);
      // SECURITY: On error, deny access (better safe than sorry)
      return false;
    }
  }, []);

  return {
    hasAccess,
    hasFullAccess,
    isEnrolled,
    hasPurchased,
    isInstructor,
    isAdmin,
    getAccessDescription,
    isLoggedIn,
    userRole: userData?.role,
    verifyServerPayment, // SECURITY FIX 3.19.1: Add server verification function
  };
};

export default useCourseAccess;
