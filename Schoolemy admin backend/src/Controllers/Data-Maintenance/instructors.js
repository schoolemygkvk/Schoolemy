import Instructors from "../../Models/Data-Maintenance/InstructorsModel.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../DB/adudios3.js";

// Base64 validation (limit 100MB) - same as Admin controller
const MAX_BASE64_SIZE = 100 * 1024 * 1024 * 1.33; // ≈133MB
const validateBase64Size = (base64String, label = "Image") => {
  if (!base64String) return true;
  const sizeInBytes = (base64String.length * 3) / 4;
  if (sizeInBytes > MAX_BASE64_SIZE) {
    throw new Error(`${label} exceeds 100MB size limit`);
  }
  return true;
};

// S3 config for instructor profile images - same as Admin controller
const STAFF_BUCKET = process.env.AWS_S3_STAFF_BUCKET || process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION || "ap-south-1";

// Generic: Upload base64 image to S3 - same flow as Admin controller
const uploadBase64ToS3 = async (base64String, folder = "instructor-profiles") => {
  if (!STAFF_BUCKET) {
    throw new Error("AWS_S3_STAFF_BUCKET is not configured in .env");
  }
  if (!base64String) return null;

  const match = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
  const contentType = match ? match[1] : "image/jpeg";
  const base64Data = match ? match[2] : base64String;

  const buffer = Buffer.from(base64Data, "base64");
  const ext = contentType.split("/")[1] || "jpg";
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: STAFF_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3.send(command);

  const s3Url = `https://${STAFF_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  return s3Url;
};

const uploadProfileImageToS3 = (base64String) =>
  uploadBase64ToS3(base64String, "instructor-profiles");

// Delete file from S3 (accepts S3 URL or key) - same as Admin controller
const deleteFileFromS3 = async (s3UrlOrKey) => {
  if (!s3UrlOrKey || !STAFF_BUCKET) return;

  let key;
  if (s3UrlOrKey.startsWith("http")) {
    try {
      const url = new URL(s3UrlOrKey);
      key = decodeURIComponent(url.pathname.substring(1));
    } catch {
      return;
    }
  } else {
    key = s3UrlOrKey;
  }

  const command = new DeleteObjectCommand({
    Bucket: STAFF_BUCKET,
    Key: key,
  });
  await s3.send(command);
};

// Create new instructor with profile picture (base64) - same flow as Admin createAdmin
export const createInstructor = async (req, res) => {
  try {
    const {
      name,
      designation,
      tenure,
      remuneration,
      qualification,
      order,
      profilePictureBase64,
    } = req.body || {};

    // Support both: file in image field (FormData) OR profilePictureBase64 (JSON/FormData)
    let profilePicBase64 = profilePictureBase64;
    if (!profilePicBase64 && req.file?.buffer) {
      const mime = req.file.mimetype || "image/jpeg";
      profilePicBase64 = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
    }

    const requiredFields = {
      name,
      designation,
      tenure,
      remuneration,
      qualification,
    };
    const missingFields = Object.entries(requiredFields)
      .filter(
        ([key, value]) => value === undefined || value === null || value === "",
      )
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate Base64 image size
    if (profilePicBase64) {
      validateBase64Size(profilePicBase64, "Profile picture");
    }

    // Upload profile image to S3 and get URL - same as Admin controller
    let imageUrl = null;
    if (profilePicBase64) {
      try {
        imageUrl = await uploadProfileImageToS3(profilePicBase64);
      } catch (uploadErr) {
        console.error("❌ Profile image S3 upload failed:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image to S3",
          error: uploadErr.message,
        });
      }
    }

    const instructorData = {
      name,
      designation,
      tenure,
      remuneration,
      qualification,
      order: order !== undefined ? parseInt(order) : 0,
      imageUrl,
    };

    const instructor = await Instructors.create(instructorData);
    res.status(201).json({
      success: true,
      instructor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all instructors with pagination
export const getAllInstructors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const instructors = await Instructors.find()
      .skip(skip)
      .limit(limit)
      .sort({ order: 1, createdAt: -1 });

    const total = await Instructors.countDocuments();

    res.status(200).json({
      success: true,
      instructors,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update instructor with profile picture (base64) - same flow as Admin updateAdmin
export const updateInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      designation,
      tenure,
      remuneration,
      qualification,
      order,
      profilePictureBase64,
    } = req.body || {};

    // Support both: file in image field OR profilePictureBase64
    let profilePicBase64 = profilePictureBase64;
    if (!profilePicBase64 && req.file?.buffer) {
      const mime = req.file.mimetype || "image/jpeg";
      profilePicBase64 = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (designation !== undefined) updateData.designation = designation;
    if (tenure !== undefined) updateData.tenure = tenure;
    if (remuneration !== undefined) updateData.remuneration = remuneration;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (order !== undefined) updateData.order = parseInt(order);

    const instructor = await Instructors.findById(id);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    // Handle profile picture upload to S3 - same as Admin controller
    if (profilePicBase64) {
      validateBase64Size(profilePicBase64, "Profile picture");

      // Delete old image from S3 if exists
      if (instructor.imageUrl) {
        try {
          await deleteFileFromS3(instructor.imageUrl);
        } catch (delErr) {
          console.warn("Could not delete old profile image from S3:", delErr.message);
        }
      }

      // Upload new image to S3
      try {
        updateData.imageUrl = await uploadProfileImageToS3(profilePicBase64);
      } catch (uploadErr) {
        console.error("❌ Profile image S3 upload failed:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image to S3",
          error: uploadErr.message,
        });
      }
    }

    const updatedInstructor = await Instructors.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      instructor: updatedInstructor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update instructor image only - same base64 S3 flow as Admin
export const updateInstructorImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { profilePictureBase64 } = req.body || {};

    // Support both: file in image field OR profilePictureBase64
    let profilePicBase64 = profilePictureBase64;
    if (!profilePicBase64 && req.file?.buffer) {
      const mime = req.file.mimetype || "image/jpeg";
      profilePicBase64 = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
    }

    const instructor = await Instructors.findById(id);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    if (!profilePicBase64) {
      return res.status(400).json({
        success: false,
        message: "Image file or profilePictureBase64 is required",
      });
    }

    validateBase64Size(profilePicBase64, "Profile picture");

    // Delete old image from S3 if exists
    if (instructor.imageUrl) {
      try {
        await deleteFileFromS3(instructor.imageUrl);
      } catch (delErr) {
        console.warn("Could not delete old profile image from S3:", delErr.message);
      }
    }

    // Upload new image to S3
    try {
      instructor.imageUrl = await uploadProfileImageToS3(profilePicBase64);
      await instructor.save();

      res.status(200).json({
        success: true,
        message: "Instructor image updated successfully",
        instructor,
      });
    } catch (uploadErr) {
      console.error("❌ Profile image S3 upload failed:", uploadErr);
      return res.status(500).json({
        success: false,
        message: "Failed to upload profile image to S3",
        error: uploadErr.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove instructor image only - same delete flow as Admin
export const removeInstructorImage = async (req, res) => {
  try {
    const { id } = req.params;

    const instructor = await Instructors.findById(id);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    if (!instructor.imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Instructor does not have an image to remove",
      });
    }

    // Delete image from S3 - same as Admin controller
    try {
      await deleteFileFromS3(instructor.imageUrl);
    } catch (delErr) {
      console.warn("Could not delete profile image from S3:", delErr.message);
    }

    instructor.imageUrl = null;
    await instructor.save();

    res.status(200).json({
      success: true,
      message: "Instructor image removed successfully",
      instructor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete instructor - same S3 delete flow as Admin
export const deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;

    const instructor = await Instructors.findById(id);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    // Delete profile image from S3 if exists - same as Admin controller
    if (instructor.imageUrl) {
      try {
        await deleteFileFromS3(instructor.imageUrl);
      } catch (delErr) {
        console.warn("Could not delete profile image from S3:", delErr.message);
      }
    }

    await Instructors.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Instructor deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
