import Subject from "../../Models/Student-PCM/SubjectModel.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Get all subjects (active only by default)
export const getAllSubjects = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === "true" ? {} : { isActive: true };

    const subjects = await Subject.find(filter).sort({ displayOrder: 1, name: 1 });

    return res.json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    console.error("getAllSubjects error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch subjects",
    });
  }
};

// Get subject by code
export const getSubjectByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const subject = await Subject.findOne({ code: code.toLowerCase() });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: "Subject not found",
      });
    }

    return sendSuccess(res, 200, "Success", subject,
    );
  } catch (error) {
    console.error("getSubjectByCode error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch subject",
    });
  }
};

// Create new subject
export const createSubject = async (req, res) => {
  try {
    const { name, code, meetLink, description, icon, color, displayOrder } = req.body;

    if (!name || !code || !meetLink) {
      return res.status(400).json({
        success: false,
        error: "Name, code, and meetLink are required",
      });
    }

    const existingSubject = await Subject.findOne({ code: code.toLowerCase() });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        error: "Subject with this code already exists",
      });
    }

    const subject = await Subject.create({
      name,
      code: code.toLowerCase(),
      meetLink,
      description: description || "",
      icon: icon || "",
      color: color || "#3498db",
      displayOrder: displayOrder || 0,
    });

    return sendSuccess(res, 201, "Created successfully", subject,
    );
  } catch (error) {
    console.error("createSubject error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create subject",
    });
  }
};

// Update subject
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, meetLink, description, icon, color, isActive, displayOrder } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code.toLowerCase();
    if (meetLink !== undefined) updateData.meetLink = meetLink;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    const subject = await Subject.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: "Subject not found",
      });
    }

    return sendSuccess(res, 200, "Subject updated successfully", subject,
    );
  } catch (error) {
    console.error("updateSubject error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update subject",
    });
  }
};

// Delete subject
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: "Subject not found",
      });
    }

    return sendSuccess(res, 200, "Subject deleted successfully", subject,
    );
  } catch (error) {
    console.error("deleteSubject error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to delete subject",
    });
  }
};

// Seed default subjects (for initial setup)
export const seedDefaultSubjects = async (req, res) => {
  try {
    const defaultSubjects = [
      {
        name: "Physics",
        code: "physics",
        meetLink: process.env.PHYSICS_MEET_LINK || "https://meet.google.com/physics-default",
        description: "Physics classes for PCM students",
        color: "#e74c3c",
        displayOrder: 1,
      },
      {
        name: "Chemistry",
        code: "chemistry",
        meetLink: process.env.CHEMISTRY_MEET_LINK || "https://meet.google.com/chemistry-default",
        description: "Chemistry classes for PCM students",
        color: "#2ecc71",
        displayOrder: 2,
      },
      {
        name: "Mathematics",
        code: "mathematics",
        meetLink: process.env.MATHS_MEET_LINK || "https://meet.google.com/maths-default",
        description: "Mathematics classes for PCM students",
        color: "#3498db",
        displayOrder: 3,
      },
    ];

    const results = [];
    for (const subjectData of defaultSubjects) {
      const existing = await Subject.findOne({ code: subjectData.code });
      if (!existing) {
        const created = await Subject.create(subjectData);
        results.push({ action: "created", subject: created });
      } else {
        results.push({ action: "exists", subject: existing });
      }
    }

    return sendSuccess(res, 200, "Default subjects seeded", results,
    );
  } catch (error) {
    console.error("seedDefaultSubjects error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to seed subjects",
    });
  }
};
