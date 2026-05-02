import logger  from "../Utils/logger.js";

import mongoose from "mongoose";
import Wishlist from "../Models/Wishlist-Model.js";
import {
  resolveWishlistCourse,
  buildWishlistSnapshot,
} from "../Utils/wishlistCourseResolve.js";


function normalizeUserId(raw) {
  if (raw == null) return null;
  const s =
    typeof raw === "object" && typeof raw.toString === "function"
      ? String(raw)
      : String(raw);
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}


function courseIdToString(item) {
  const cid = item.courseId;
  if (cid && typeof cid === "object" && cid._id != null) return String(cid._id);
  return cid != null ? String(cid) : "";
}


export const getUserWishlist = async (req, res) => {
  try {
    const userId = normalizeUserId(req.userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const wishlist = await Wishlist.findOne({ userId }).lean();

    const rows = (wishlist?.courses || []).map((c) => ({
      courseId: courseIdToString(c),
      courseSnapshot: {
        ...c.courseSnapshot,
        isTutorCourse: !!c.courseSnapshot?.isTutorCourse,
      },
      addedAt: c.addedAt,
    }));

    res.json({
      success: true,
      data: rows,
      message: "Wishlist retrieved successfully",
    });
  } catch (error) {
    logger.error("Error fetching wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
};


export const addToWishlist = async (req, res) => {
  try {
    const userId = normalizeUserId(req.userId);
    const { courseId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const resolved = await resolveWishlistCourse(courseId);
    if (!resolved) {
      return res.status(404).json({
        success: false,
        message: "Course not found or not available for wishlist",
      });
    }

    const { doc: course, isTutorCourse } = resolved;
    const idStr = String(course._id);

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, courses: [] });
    }

    const existingIndex = wishlist.courses.findIndex(
      (item) => item.courseId.toString() === idStr,
    );

    if (existingIndex !== -1) {
      return res.status(400).json({
        success: false,
        message: "Course already in wishlist",
      });
    }

    wishlist.courses.push({
      courseId: course._id,
      courseSnapshot: buildWishlistSnapshot(course, isTutorCourse),
    });

    await wishlist.save();

    const added = wishlist.courses[wishlist.courses.length - 1];

    res.status(201).json({
      success: true,
      message: "Course added to wishlist",
      data: {
        courseId: idStr,
        courseSnapshot: added.courseSnapshot,
        addedAt: added.addedAt,
      },
    });
  } catch (error) {
    logger.error("Error adding to wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add course to wishlist",
      error: error.message,
    });
  }
};


export const removeFromWishlist = async (req, res) => {
  try {
    const userId = normalizeUserId(req.userId);
    const { courseId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    const target = String(courseId);
    const initialLength = wishlist.courses.length;
    wishlist.courses = wishlist.courses.filter(
      (item) => item.courseId.toString() !== target,
    );

    if (wishlist.courses.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Course not found in wishlist",
      });
    }

    await wishlist.save();

    res.json({
      success: true,
      message: "Course removed from wishlist",
      data: wishlist.courses,
    });
  } catch (error) {
    logger.error("Error removing from wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove course from wishlist",
      error: error.message,
    });
  }
};


export const checkWishlistStatus = async (req, res) => {
  try {
    const userId = normalizeUserId(req.userId);
    const { courseId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const wishlist = await Wishlist.findOne({ userId });
    const target = String(courseId);
    const inWishlist = wishlist?.courses?.some(
      (item) => item.courseId.toString() === target,
    );

    res.json({
      success: true,
      inWishlist: !!inWishlist,
    });
  } catch (error) {
    logger.error("Error checking wishlist status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check wishlist status",
      error: error.message,
    });
  }
};


export const syncWishlistFromClient = async (req, res) => {
  try {
    const userId = normalizeUserId(req.userId);
    const rawIds = Array.isArray(req.body?.courseIds) ? req.body.courseIds : [];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const seen = new Set();
    const entries = [];
    const skippedIds = [];

    for (const raw of rawIds) {
      const idStr = raw != null ? String(raw) : "";
      if (!idStr || seen.has(idStr)) continue;
      seen.add(idStr);

      const resolved = await resolveWishlistCourse(idStr);
      if (!resolved) {
        skippedIds.push(idStr);
        continue;
      }

      const { doc, isTutorCourse } = resolved;
      entries.push({
        courseId: doc._id,
        courseSnapshot: buildWishlistSnapshot(doc, isTutorCourse),
      });
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, courses: [] });
    }

    wishlist.courses = entries;
    await wishlist.save();

    const data = wishlist.courses.map((c) => ({
      courseId: String(c.courseId),
      courseSnapshot: c.courseSnapshot,
      addedAt: c.addedAt,
    }));

    res.json({
      success: true,
      message:
        skippedIds.length > 0
          ? `Wishlist synced; ${skippedIds.length} id(s) skipped (not found)`
          : "Wishlist synced successfully",
      data,
      skippedIds,
    });
  } catch (error) {
    logger.error("Error syncing wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync wishlist",
      error: error.message,
    });
  }
};
