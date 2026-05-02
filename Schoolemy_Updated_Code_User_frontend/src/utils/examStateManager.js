/**
 * Exam State Manager Utility
 * Provides standardized localStorage key management for exam state across the application
 *
 * Key Convention: exam_state_<courseId>_<chapterIndex|examId>
 *
 * This module ensures consistency in exam state storage, making it easier to:
 * - Debug exam state issues
 * - Migrate between key formats
 * - Prevent data collisions
 * - Support multiple exams simultaneously
 *
 * SECURITY FIX 3.30.1: Uses safeJsonParse to prevent silent data loss
 */

import { safeJsonParse } from './safeStorageParser.js';

export class ExamStateManager {
  /**
   * Generate standardized localStorage key for exam state
   * @param {string} courseId - The course ID
   * @param {number|string} chapterIndex - The chapter index or ID
   * @param {string} examId - Optional: Specific exam ID (takes precedence)
   * @returns {string} Standardized key in format: exam_state_<courseId>_<identifier>
   */
  static generateKey(courseId, chapterIndex, examId = null) {
    if (!courseId) {
      throw new Error("courseId is required for exam state key generation");
    }

    let identifier;
    if (examId) {
      identifier = examId;
      console.debug(`Using examId for key: exam_state_${courseId}_${examId}`);
    } else if (chapterIndex !== undefined && chapterIndex !== null) {
      identifier = chapterIndex;
      console.debug(`Using chapterIndex for key: exam_state_${courseId}_${chapterIndex}`);
    } else {
      identifier = 'default';
      console.warn("No chapterIndex or examId provided, using default identifier");
    }

    return `exam_state_${courseId}_${identifier}`;
  }

  /**
   * Save exam state to localStorage
   * @param {string} courseId - The course ID
   * @param {object} examData - The exam state data to save
   * @param {number|string} chapterIndex - The chapter index
   * @param {string} examId - Optional: Specific exam ID
   * @returns {boolean} Success status
   */
  static save(courseId, examData, chapterIndex, examId = null) {
    try {
      if (!courseId) {
        throw new Error("courseId is required");
      }
      if (!examData || typeof examData !== 'object') {
        throw new Error("examData must be a valid object");
      }

      const key = this.generateKey(courseId, chapterIndex, examId || examData?.examId);
      const serialized = JSON.stringify(examData);

      localStorage.setItem(key, serialized);
      console.log(`Exam state saved successfully with key: ${key}`);
      return true;
    } catch (error) {
      console.error("Error saving exam state:", error);
      return false;
    }
  }

  /**
   * Load exam state from localStorage
   * SECURITY FIX 3.30.1: Uses safeJsonParse to prevent silent data loss
   * @param {string} courseId - The course ID
   * @param {number|string} chapterIndex - The chapter index
   * @param {string} examId - Optional: Specific exam ID
   * @returns {object|null} Exam state data or null if not found
   */
  static load(courseId, chapterIndex, examId = null) {
    try {
      if (!courseId) {
        throw new Error("courseId is required");
      }

      const key = this.generateKey(courseId, chapterIndex, examId);
      const saved = localStorage.getItem(key);

      if (saved) {
        // SECURITY FIX 3.30.1: Safe parse with error notification
        const data = safeJsonParse(saved, null, key, `exam state for ${courseId}`);
        if (data) {
          console.log(`Exam state loaded from key: ${key}`);
          return data;
        }
      }

      // Attempt migration from old key format
      const migratedData = this.migrateFromOldFormat(courseId, chapterIndex, key);
      if (migratedData) {
        return migratedData;
      }

      console.debug(`No exam state found for key: ${key}`);
      return null;
    } catch (error) {
      console.error("Error loading exam state:", error);
      return null;
    }
  }

  /**
   * Clear exam state from localStorage
   * @param {string} courseId - The course ID
   * @param {number|string} chapterIndex - The chapter index
   * @param {string} examId - Optional: Specific exam ID
   * @returns {boolean} Success status
   */
  static clear(courseId, chapterIndex, examId = null) {
    try {
      if (!courseId) {
        throw new Error("courseId is required");
      }

      const key = this.generateKey(courseId, chapterIndex, examId);
      localStorage.removeItem(key);
      console.log(`Exam state cleared for key: ${key}`);

      // Also clean up old format keys
      const oldKey = `examState_${courseId}_${chapterIndex || 'default'}`;
      localStorage.removeItem(oldKey);

      return true;
    } catch (error) {
      console.error("Error clearing exam state:", error);
      return false;
    }
  }

  /**
   * Migrate exam state from old key format to new format
   * @param {string} courseId - The course ID
   * @param {number|string} chapterIndex - The chapter index
   * @param {string} newKey - The new key format
   * @returns {object|null} Migrated data or null if old key not found
   * @private
   */
  static migrateFromOldFormat(courseId, chapterIndex, newKey) {
    try {
      const oldFormats = [
        `examState_${courseId}_${chapterIndex}`,
        `exam_state_${courseId}_${chapterIndex}`,
        `examData_${courseId}_${chapterIndex}`,
      ];

      for (const oldKey of oldFormats) {
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
          try {
            const data = JSON.parse(oldData);
            // Migrate to new format
            localStorage.setItem(newKey, oldData);
            localStorage.removeItem(oldKey);
            console.warn(`Migrated exam state from old key: ${oldKey} → ${newKey}`);
            return data;
          } catch (parseError) {
            console.error(`Failed to parse data from old key: ${oldKey}`, parseError);
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error during migration:", error);
      return null;
    }
  }

  /**
   * Get all exam states for a course
   * @param {string} courseId - The course ID
   * @returns {object} Map of examId/chapterIndex to exam state data
   */
  static getAllForCourse(courseId) {
    try {
      if (!courseId) {
        throw new Error("courseId is required");
      }

      const examStates = {};
      const prefix = `exam_state_${courseId}_`;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const identifier = key.substring(prefix.length);
          const data = localStorage.getItem(key);
          if (data) {
            try {
              examStates[identifier] = JSON.parse(data);
            } catch (parseError) {
              console.error(`Failed to parse exam state for ${key}`, parseError);
            }
          }
        }
      }

      console.log(`Retrieved ${Object.keys(examStates).length} exam states for course: ${courseId}`);
      return examStates;
    } catch (error) {
      console.error("Error retrieving exam states:", error);
      return {};
    }
  }

  /**
   * Clear all exam states for a course
   * @param {string} courseId - The course ID
   * @returns {number} Number of states cleared
   */
  static clearAllForCourse(courseId) {
    try {
      if (!courseId) {
        throw new Error("courseId is required");
      }

      let cleared = 0;
      const prefix = `exam_state_${courseId}_`;
      const keysToDelete = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
        cleared++;
      });

      console.log(`Cleared ${cleared} exam states for course: ${courseId}`);
      return cleared;
    } catch (error) {
      console.error("Error clearing exam states:", error);
      return 0;
    }
  }

  /**
   * Validate exam state data structure
   * @param {object} examData - The exam state data to validate
   * @returns {boolean} True if valid exam state format
   */
  static isValidExamState(examData) {
    if (!examData || typeof examData !== 'object') {
      return false;
    }

    // Check for minimum required fields
    const requiredFields = ['examId', 'courseId', 'startTime'];
    return requiredFields.every(field => examData.hasOwnProperty(field));
  }

  /**
   * Get exam state size in bytes
   * @param {string} courseId - The course ID
   * @param {number|string} chapterIndex - The chapter index
   * @returns {number} Size in bytes or 0 if not found
   */
  static getSize(courseId, chapterIndex) {
    try {
      const key = this.generateKey(courseId, chapterIndex);
      const data = localStorage.getItem(key);
      return data ? new Blob([data]).size : 0;
    } catch (error) {
      console.error("Error getting exam state size:", error);
      return 0;
    }
  }
}

export default ExamStateManager;
