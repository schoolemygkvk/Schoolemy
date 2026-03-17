import Admin from "../../Models/Admin/Admin-login-Model.js";
import Tutor from "../../Models/Tutor/TutorModel.js";

import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import {
  sendWelcomeEmail,
  sendRemoveAdminEmail,
} from "../../Notification/Adminwelcomemail.js";
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../DB/adudios3.js";

// Generate member ID for BOS roles
const generateMemberId = async (role) => {
  const currentYear = new Date().getFullYear().toString();
  const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
  const count = await Admin.countDocuments({
    role,
    "bosDetails.member_id": new RegExp(`^${currentYear}`),
  });
  const paddedCount = (count + 1).toString().padStart(3, "0");
  if (role === "boscontroller") return `${currentYear}${paddedCount}`;
  if (role === "bosmembers") return `${currentYear}${uniqueId}${paddedCount}`;
  return null;
};

// Base64 validation (limit 100MB)
const MAX_BASE64_SIZE = 100 * 1024 * 1024 * 1.33; // ≈133MB
const validateBase64Size = (base64String, label = "Image") => {
  if (!base64String) return true;
  const sizeInBytes = (base64String.length * 3) / 4;
  if (sizeInBytes > MAX_BASE64_SIZE) {
    throw new Error(`${label} exceeds 100MB size limit`);
  }
  return true;
};

// S3 config for admin profile images
const STAFF_BUCKET = process.env.AWS_S3_STAFF_BUCKET;
const AWS_REGION = process.env.AWS_REGION || "ap-south-1";

// Generic: Upload base64 image to S3
const uploadBase64ToS3 = async (base64String, folder = "admin-profiles") => {
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
  uploadBase64ToS3(base64String, "admin-profiles");

const uploadGovtDocImageToS3 = (base64String) =>
  uploadBase64ToS3(base64String, "admin-govt-docs");

/** Get base64 string for govt doc upload from proof (documentImageBase64 or documentImage when it's base64). Never use for S3 URLs. */
const getGovtDocBase64 = (proof) => {
  if (proof.documentImageBase64) return proof.documentImageBase64;
  const doc = proof.documentImage;
  if (!doc || typeof doc !== "string") return null;
  if (doc.startsWith("http://") || doc.startsWith("https://")) return null;
  if (doc.startsWith("data:image")) return doc;
  // Raw base64 (e.g. from Admindetail.js which sends documentImage = reader.result.split(",")[1])
  if (/^[A-Za-z0-9+/=]+$/.test(doc)) return `data:image/jpeg;base64,${doc}`;
  return null;
};

// Delete file from S3 (accepts S3 URL or key)
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

/**
 * Proxy S3 image for PDF export - bypasses CORS by fetching server-side
 * Only allows our STAFF_BUCKET S3 URLs for security
 */
export const proxyImage = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "Missing url query parameter" });
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return res.status(400).json({ message: "Invalid url" });
    }
    if (!STAFF_BUCKET) {
      return res.status(500).json({ message: "S3 not configured" });
    }
    const s3Host = `${STAFF_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
    if (!url.includes(s3Host)) {
      return res.status(403).json({ message: "Only STAFF_BUCKET images allowed" });
    }
    let key;
    try {
      const parsed = new URL(url);
      key = decodeURIComponent(parsed.pathname.substring(1));
    } catch {
      return res.status(400).json({ message: "Invalid S3 URL" });
    }
    const command = new GetObjectCommand({
      Bucket: STAFF_BUCKET,
      Key: key,
    });
    const response = await s3.send(command);
    const body = response.Body;
    const contentType = response.ContentType || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    body.pipe(res);
  } catch (error) {
    console.error("❌ Proxy image error:", error?.message);
    res.status(500).json({ message: "Failed to fetch image", error: error?.message });
  }
};

/**
 * Create Admin: Images are uploaded to S3 only. Base64 is never saved in DB.
 * - profilePictureBase64 (from body) → upload to S3 → save profilePictureUpload (S3 URL) in DB
 * - govtIdProofs[].documentImageBase64 → upload to S3 → save documentImage (S3 URL) in DB
 */
export const createAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const {
      name,
      email,
      mobilenumber,
      password,
      conformpassword,
      gender,
      age,
      permanentAddress,
      tempAddress,
      role,
      bosDetails,
      govtIdProofs,
      profilePictureBase64, // request-only: uploaded to S3, URL saved in DB
    } = req.body;

    // ✅ SECURITY: Only superadmin can create superadmin accounts
    const currentUserRole = req.user?.role?.toLowerCase().trim();
    if (role?.toLowerCase().trim() === "superadmin" && currentUserRole !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only superadmin can create superadmin accounts"
      });
    }

    if (password !== conformpassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedMobile = mobilenumber.trim();

    // Check existing admin
    const existingAdmin = await Admin.findOne({
      $or: [{ email: normalizedEmail }, { mobilenumber: normalizedMobile }],
    });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Email or Mobile number already exists" });
    }

    // Handle BOS member logic
    let generatedMemberId = null;
    if (role === "bosmembers" || role === "boscontroller") {
      if (
        !bosDetails ||
        !bosDetails.designation ||
        !bosDetails.joining_date ||
        !bosDetails.term_end
      ) {
        return res.status(400).json({
          message:
            "BOS member details (designation, joining_date, term_end) are required",
        });
      }
      generatedMemberId = await generateMemberId(role);
    }

    // Validate Base64 image sizes
    if (profilePictureBase64)
      validateBase64Size(profilePictureBase64, "Profile picture");

    if (govtIdProofs?.length) {
      for (const proof of govtIdProofs) {
        const base64 = getGovtDocBase64(proof);
        if (base64) validateBase64Size(base64, `${proof.idType} image`);
      }
    }

    // Upload profile image to S3 and get URL
    let profilePictureUrl = null;
    if (profilePictureBase64) {
      try {
        profilePictureUrl = await uploadProfileImageToS3(profilePictureBase64);
      } catch (uploadErr) {
        console.error("❌ Profile image S3 upload failed:", uploadErr);
        return res.status(500).json({
          message: "Failed to upload profile image to S3",
          error: uploadErr.message,
        });
      }
    }

    // Upload govtIdProofs document images to S3; store only S3 URL in DB (never base64)
    let processedGovtIdProofs = [];
    if (govtIdProofs?.length) {
      try {
        for (const proof of govtIdProofs) {
          const base64 = getGovtDocBase64(proof);
          const documentImageUrl = base64
            ? await uploadGovtDocImageToS3(base64)
            : null;
          processedGovtIdProofs.push({
            idType: proof.idType,
            idNumber: proof.idNumber,
            documentImage: documentImageUrl,
          });
        }
      } catch (uploadErr) {
        console.error("❌ Govt ID proof S3 upload failed:", uploadErr);
        return res.status(500).json({
          message: "Failed to upload government ID document(s) to S3",
          error: uploadErr.message,
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Construct admin object
    const newAdmin = new Admin({
      name,
      email: normalizedEmail,
      mobilenumber: normalizedMobile,
      password: hashedPassword,
      gender,
      age,
      permanentAddress,
      tempAddress,
      role,
      // ✅ Save S3 URL in profilePictureUpload
      profilePictureUpload: profilePictureUrl,
      // ✅ Save S3 URLs in govtIdProofs documentImage
      govtIdProofs: processedGovtIdProofs,
      ...(role === "bosmembers" || role === "boscontroller"
        ? {
            bosDetails: {
              ...bosDetails,
              member_id: generatedMemberId,
              joining_date: new Date(bosDetails.joining_date),
              term_end: new Date(bosDetails.term_end),
            },
          }
        : {}),
    });

    await newAdmin.save();

    // Send welcome email
    await sendWelcomeEmail({
      name,
      email: normalizedEmail,
      mobilenumber: normalizedMobile,
      gender,
      role,
      ...(role === "bosmembers" || role === "boscontroller"
        ? { bosDetails: newAdmin.bosDetails }
        : {}),
    });

    // Exclude password before returning
    const { password: _, ...adminData } = newAdmin.toObject();

    res.status(201).json({
      message: "Admin created successfully",
      admin: adminData,
    });
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Admin
export const updateAdmin = async (req, res) => {
  try {
    // ✅ SECURITY: Only superadmin can update to/from superadmin role
    const currentUserRole = req.user?.role?.toLowerCase().trim();
    const newRole = req.body.role?.toLowerCase().trim();

    const existingAdmin = await Admin.findById(req.params.id);

    if (!existingAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (currentUserRole !== "superadmin") {
      const existingRole = existingAdmin.role?.toLowerCase().trim();

      // Prevent non-superadmin from updating superadmin accounts
      if (existingRole === "superadmin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Only superadmin can update superadmin accounts"
        });
      }

      // Prevent non-superadmin from elevating to superadmin
      if (newRole === "superadmin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Only superadmin can assign superadmin role"
        });
      }
    }

    // Build update object (exclude profilePictureBase64, govtIdProofs - we handle separately)
    const { profilePictureBase64, govtIdProofs: govtIdProofsInput, ...updateData } = req.body;

    // Handle profile image upload to S3
    if (profilePictureBase64) {
      validateBase64Size(profilePictureBase64, "Profile picture");

      // Delete old image from S3 if exists
      if (existingAdmin.profilePictureUpload) {
        try {
          await deleteFileFromS3(existingAdmin.profilePictureUpload);
        } catch (delErr) {
          console.warn("Could not delete old profile image from S3:", delErr.message);
        }
      }

      // Upload new image to S3
      try {
        updateData.profilePictureUpload = await uploadProfileImageToS3(profilePictureBase64);
      } catch (uploadErr) {
        console.error("❌ Profile image S3 upload failed:", uploadErr);
        return res.status(500).json({
          message: "Failed to upload profile image to S3",
          error: uploadErr.message,
        });
      }
    }

    // Handle govtIdProofs document images to S3
    if (Array.isArray(govtIdProofsInput)) {
      const processedGovtIdProofs = [];
      const existingProofs = existingAdmin.govtIdProofs || [];

      for (let i = 0; i < govtIdProofsInput.length; i++) {
        const proof = { ...govtIdProofsInput[i] };
        const existingProof = existingProofs[i];
        const base64 = getGovtDocBase64(proof);

        if (base64) {
          validateBase64Size(base64, `${proof.idType} document`);

          // Delete old image from S3 if exists
          if (existingProof?.documentImage?.startsWith?.("http")) {
            try {
              await deleteFileFromS3(existingProof.documentImage);
            } catch (delErr) {
              console.warn(`Could not delete old ${proof.idType} doc from S3:`, delErr.message);
            }
          }

          // Upload new image to S3; store only S3 URL in DB (never base64)
          try {
            proof.documentImage = await uploadGovtDocImageToS3(base64);
          } catch (uploadErr) {
            console.error("❌ Govt ID proof S3 upload failed:", uploadErr);
            return res.status(500).json({
              message: "Failed to upload government ID document(s) to S3",
              error: uploadErr.message,
            });
          }
        } else if (proof.documentImage?.startsWith?.("http")) {
          // Keep existing S3 URL
        } else {
          proof.documentImage = null;
        }

        delete proof.documentImageBase64;
        processedGovtIdProofs.push({
          idType: proof.idType,
          idNumber: proof.idNumber,
          documentImage: proof.documentImage,
        });
      }

      // Delete old S3 images for proofs that were removed (array shortened)
      for (let i = govtIdProofsInput.length; i < existingProofs.length; i++) {
        const doc = existingProofs[i]?.documentImage;
        if (doc?.startsWith?.("http")) {
          try {
            await deleteFileFromS3(doc);
          } catch (delErr) {
            console.warn("Could not delete removed govt doc from S3:", delErr.message);
          }
        }
      }

      updateData.govtIdProofs = processedGovtIdProofs;
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedAdmin)
      return res.status(404).json({ message: "Admin not found" });

    res
      .status(200)
      .json({ message: "Admin updated successfully", admin: updatedAdmin });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating admin", error: error.message });
  }
};

// Delete Admin
export const deleteAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find admin before deleting to get email, name, role, profilePictureUpload
    const adminToDelete = await Admin.findById(id);

    if (!adminToDelete) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    // Delete profile image from S3 if exists
    if (adminToDelete.profilePictureUpload) {
      try {
        await deleteFileFromS3(adminToDelete.profilePictureUpload);
      } catch (delErr) {
        console.warn("Could not delete profile image from S3:", delErr.message);
      }
    }

    // Delete govtIdProofs document images from S3
    if (adminToDelete.govtIdProofs?.length) {
      for (const proof of adminToDelete.govtIdProofs) {
        if (proof.documentImage?.startsWith?.("http")) {
          try {
            await deleteFileFromS3(proof.documentImage);
          } catch (delErr) {
            console.warn("Could not delete govt doc from S3:", delErr.message);
          }
        }
      }
    }

    const deletedAdmin = await Admin.findByIdAndDelete(id);

    // ✅ Send removal email
    await sendRemoveAdminEmail({
      name: adminToDelete.name,
      email: adminToDelete.email,
      role: adminToDelete.role,
    });

    return res.status(200).json({
      success: true,
      message: "Admin deleted and notified successfully",
      data: deletedAdmin,
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Get Admin by Email (for profile)
export const profile = async (req, res) => {
  try {
    // 1️⃣ Validate JWT payload
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Email not found in token",
      });
    }

    const { email, role } = req.user; // role can be 'tutor', 'superadmin', 'bosmembers', etc.
    let userProfile = null;
    let userType = "unknown";

    // 2️⃣ Try Admin first (multiple roles supported)
    userProfile = await Admin.findOne({
      email: email.toLowerCase().trim(),
    }).select(
      "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -otpAttempts"
    );

    if (userProfile) {
      userType = "admin";
    } else {
      // 3️⃣ If not admin, try Tutor
      userProfile = await Tutor.findOne({
        email: email.toLowerCase().trim(),
      }).select(
        "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -otpAttempts"
      );
      if (userProfile) {
        userType = "tutor";
      }
    }

    // 4️⃣ If no matching record
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User not found in Admin or Tutor records",
      });
    }

    // 5️⃣ Response (handles admin with multiple roles)
    res.status(200).json({
      success: true,
      message: `${userType === "admin" ? "Admin" : "Tutor"} profile retrieved successfully`,
      userType,
      role: userProfile.role, // could be 'superadmin', 'boscontroller', 'tutor', etc.
      profile: userProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: error.message,
    });
  }
};