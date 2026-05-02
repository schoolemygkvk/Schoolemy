import Announcement from "../../Models/Announcement-Model/Announcement.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { logger } from "../../Utils/logger.js";
// SECURITY FIX 3.31.2: Input sanitization
import { sanitizeText, sanitizeUrl, sanitizeFilePath } from "../../Utils/sanitizationUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create new announcement
export const createAnnouncement = async (req, res) => {
  try {
    // SECURITY FIX 3.31.2: Sanitize all input
    let { title, content, button_text, button_url, priority } = req.body;

    title = sanitizeText(title);
    content = sanitizeText(content);
    button_text = sanitizeText(button_text);
    button_url = sanitizeUrl(button_url);  // URL validation for button link

    let image_path = "";
    if (req.file) {
      // SECURITY FIX 3.31.2: Sanitize filename to prevent path traversal
      const safeFilename = sanitizeFilePath(req.file.filename);
      image_path = `/uploads/announcements/${safeFilename}`;
    }

    const announcement = new Announcement({
      title,
      content,
      button_text: button_text || "",
      button_url: button_url || "",
      image_path,
      priority: priority || 0,
    });

    await announcement.save();

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    logger.error("Error creating announcement:", error);
    res.status(500).json({
      success: false,
      message: "Error creating announcement",
      error: error.message,
    });
  }
};

// Get all active announcements
export const getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ priority: -1, createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    logger.error("Error fetching announcements:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching announcements",
      error: error.message,
    });
  }
};

// Get all announcements (admin)
export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ priority: -1, createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    logger.error("Error fetching all announcements:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching announcements",
      error: error.message,
    });
  }
};

// Latest active announcement (homepage banner) — same sort as getActiveAnnouncements
export const getLatestAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ isActive: true })
      .sort({ priority: -1, createdAt: -1 })
      .select("-__v");

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "No active announcement found",
      });
    }

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    logger.error("Error fetching latest announcement:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching announcement",
      error: error.message,
    });
  }
};

// Get single announcement by ID
export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID",
      });
    }
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    logger.error("Error fetching announcement:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching announcement",
      error: error.message,
    });
  }
};

// Update announcement
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, button_text, button_url, priority, isActive } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Update fields
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (button_text !== undefined) announcement.button_text = button_text;
    if (button_url !== undefined) announcement.button_url = button_url;
    if (priority !== undefined) announcement.priority = priority;
    if (isActive !== undefined) announcement.isActive = isActive;

    // Handle new image upload
    if (req.file) {
      // Delete old image if exists
      if (announcement.image_path) {
        const oldImagePath = path.join(__dirname, "../../../", announcement.image_path);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      announcement.image_path = `/uploads/announcements/${req.file.filename}`;
    }

    await announcement.save();

    res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      data: announcement,
    });
  } catch (error) {
    logger.error("Error updating announcement:", error);
    res.status(500).json({
      success: false,
      message: "Error updating announcement",
      error: error.message,
    });
  }
};

// Delete announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Delete associated image if exists
    if (announcement.image_path) {
      const imagePath = path.join(__dirname, "../../../", announcement.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Announcement.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting announcement:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting announcement",
      error: error.message,
    });
  }
};

// Toggle announcement active status
export const toggleAnnouncementStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    res.status(200).json({
      success: true,
      message: `Announcement ${announcement.isActive ? "activated" : "deactivated"} successfully`,
      data: announcement,
    });
  } catch (error) {
    logger.error("Error toggling announcement status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling announcement status",
      error: error.message,
    });
  }
};
