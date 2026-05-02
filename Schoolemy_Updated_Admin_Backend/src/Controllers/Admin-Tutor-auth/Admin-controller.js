import Admin from "../../Models/Admin/Admin-login-Model.js";
import Tutor from "../../Models/Tutor/TutorModel.js";

import { hashPassword } from "../../Utils/passwordHash.js";
import { sendSuccess, sendError, sendNoContent, sendValidationError } from "../../Utils/responseHandler.js";
import { validationResult } from "express-validator";
import {
  sendWelcomeEmail,
  sendRemoveAdminEmail,
} from "../../Notification/Adminwelcomemail.js";
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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

const isHttpUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value);

// Delete file from S3 (accepts S3 URL or key)
const deleteFileFromS3 = async (s3UrlOrKey) => {
  // Read at runtime (after dotenv.config() has executed)
  const STAFF_BUCKET = process.env.AWS_S3_STAFF_BUCKET;

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


export const proxyImage = async (req, res) => {
  try {
    // Read at runtime (after dotenv.config() has executed)
    const STAFF_BUCKET = process.env.AWS_S3_STAFF_BUCKET;
    const AWS_REGION = process.env.AWS_REGION || "ap-south-1";

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
    console.error("Proxy image error:", error?.message);
    res.status(500).json({ message: "Failed to fetch image", error: error?.message });
  }
};


export const createAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendValidationError(res, errors.array());

    const {
      name,
      email,
      mobilenumber,
      password,
      confirmPassword: confirmPasswordBody,
      conformpassword, // legacy typo in clients; prefer confirmPassword
      gender,
      age,
      permanentAddress,
      tempAddress,
      role,
      bosDetails,
      govtIdProofs,
      profilePictureUrl,
      designationInBoard,
      designation,
      tenureStart,
      tenureEnd,
    } = req.body;

    // SECURITY: Only superadmin can create superadmin accounts
    const currentUserRole = req.user?.role?.toLowerCase().trim();
    if (role?.toLowerCase().trim() === "superadmin" && currentUserRole !== "superadmin") {
      return sendError(res, 403, "Forbidden: Only superadmin can create superadmin accounts");
    }

    const passwordConfirm = confirmPasswordBody ?? conformpassword;
    if (password !== passwordConfirm) {
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

    // Check for duplicate role if it's a singleton role
    if (['boscontroller', 'auditor', 'committeeoftrustees'].includes(role)) {
      const existingRole = await Admin.findOne({
        role: role
      });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: `An active ${role} already exists. Only one ${role} allowed per system.`
        });
      }
    }

    if (role === "committeeoftrustees") {
      if (!designationInBoard?.trim() || !tenureStart || !tenureEnd) {
        return res.status(400).json({
          message:
            "Committee of Trustees: board designation (designationInBoard), tenure start, and tenure end are required",
        });
      }
      const tStart = new Date(tenureStart);
      const tEnd = new Date(tenureEnd);
      if (Number.isNaN(tStart.getTime()) || Number.isNaN(tEnd.getTime())) {
        return res.status(400).json({ message: "Invalid tenure dates" });
      }
      if (tEnd < tStart) {
        return res
          .status(400)
          .json({ message: "Tenure end must be on or after tenure start" });
      }
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

    if (profilePictureUrl && !isHttpUrl(profilePictureUrl)) {
      return res.status(400).json({
        message: "Invalid profile picture URL. Upload image to S3 first.",
      });
    }

    let processedGovtIdProofs = [];
    if (govtIdProofs?.length) {
      for (const proof of govtIdProofs) {
        const documentImage = proof?.documentImage || null;
        if (documentImage && !isHttpUrl(documentImage)) {
          return res.status(400).json({
            message: `Invalid document image URL for ${proof?.idType || "ID proof"}. Upload to S3 first.`,
          });
        }
        processedGovtIdProofs.push({
          idType: proof.idType,
          idNumber: proof.idNumber,
          documentImage,
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    const cotFields =
      role === "committeeoftrustees"
        ? {
            designationInBoard: String(designationInBoard).trim(),
            ...(designation ? { designation } : {}),
            tenureStart: new Date(tenureStart),
            tenureEnd: new Date(tenureEnd),
          }
        : {};

    // Construct admin object
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
      profilePictureUpload: profilePictureUrl,
      govtIdProofs: processedGovtIdProofs,
      ...cotFields,
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

    return sendSuccess(res, 201, "Admin created successfully", { admin: adminData });
  } catch (error) {
    console.error("Error creating admin:", error);
    return sendError(res, 500, "Failed to create admin", error.message);
  }
};

// Update Admin
export const updateAdmin = async (req, res) => {
  try {
    // SECURITY: Only superadmin can update to/from superadmin role
    const currentUserRole = req.user?.role?.toLowerCase().trim();
    const newRole = req.body.role?.toLowerCase().trim();

    const existingAdmin = await Admin.findById(req.params.id);

    if (!existingAdmin) {
      return sendError(res, 404, "Admin not found");
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

    const { profilePictureUrl, govtIdProofs: govtIdProofsInput, ...updateData } = req.body;

    if (profilePictureUrl !== undefined) {
      if (profilePictureUrl && !isHttpUrl(profilePictureUrl)) {
        return res.status(400).json({
          message: "Invalid profile picture URL. Upload image to S3 first.",
        });
      }
      if (existingAdmin.profilePictureUpload) {
        try {
          await deleteFileFromS3(existingAdmin.profilePictureUpload);
        } catch (delErr) {
          console.warn("Could not delete old profile image from S3:", delErr.message);
        }
      }

      updateData.profilePictureUpload = profilePictureUrl || null;
    }

    if (Array.isArray(govtIdProofsInput)) {
      const processedGovtIdProofs = [];
      const existingProofs = existingAdmin.govtIdProofs || [];

      for (let i = 0; i < govtIdProofsInput.length; i++) {
        const proof = { ...govtIdProofsInput[i] };
        const existingProof = existingProofs[i];
        const newDocumentImage = proof.documentImage || null;
        if (newDocumentImage && !isHttpUrl(newDocumentImage)) {
          return res.status(400).json({
            message: `Invalid government ID document image URL for ${proof.idType || "proof"}. Upload to S3 first.`,
          });
        }

        if (
          existingProof?.documentImage?.startsWith?.("http") &&
          existingProof.documentImage !== newDocumentImage
        ) {
          try {
            await deleteFileFromS3(existingProof.documentImage);
          } catch (delErr) {
            console.warn(`Could not delete old ${proof.idType} doc from S3:`, delErr.message);
          }
        }

        processedGovtIdProofs.push({
          idType: proof.idType,
          idNumber: proof.idNumber,
          documentImage: newDocumentImage,
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

    // Check for duplicate role if changing to a singleton role
    if (updateData.role !== undefined) {
      const newRoleLower = updateData.role?.toLowerCase?.()?.trim?.();
      const oldRoleLower = existingAdmin.role?.toLowerCase?.()?.trim?.();

      if (['boscontroller', 'auditor', 'committeeoftrustees'].includes(newRoleLower) &&
          newRoleLower !== oldRoleLower) {
        const duplicateRoleAdmin = await Admin.findOne({
          _id: { $ne: req.params.id },
          role: newRoleLower
        });

        if (duplicateRoleAdmin) {
          return res.status(400).json({
            success: false,
            message: `An active ${newRoleLower} already exists. Only one ${newRoleLower} allowed per system.`
          });
        }
      }
    }

    const roleForCot =
      (updateData.role !== undefined ? updateData.role : existingAdmin.role)
        ?.toLowerCase?.()
        ?.trim?.();
    if (roleForCot === "committeeoftrustees") {
      const desig =
        updateData.designationInBoard !== undefined
          ? updateData.designationInBoard
          : existingAdmin.designationInBoard;
      const ts =
        updateData.tenureStart !== undefined
          ? updateData.tenureStart
          : existingAdmin.tenureStart;
      const te =
        updateData.tenureEnd !== undefined
          ? updateData.tenureEnd
          : existingAdmin.tenureEnd;
      if (!String(desig || "").trim() || !ts || !te) {
        return res.status(400).json({
          message:
            "Committee of Trustees: designationInBoard, tenure start, and tenure end are required",
        });
      }
      const d1 = new Date(ts);
      const d2 = new Date(te);
      if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) {
        return res.status(400).json({ message: "Invalid tenure dates" });
      }
      if (d2 < d1) {
        return res
          .status(400)
          .json({ message: "Tenure end must be on or after tenure start" });
      }
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
      return sendError(res, 404, "Admin not found");

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

    // Send removal email
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
    // Validate JWT payload
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Email not found in token",
      });
    }

    const { email, role } = req.user; // role can be 'tutor', 'superadmin', 'bosmembers', etc.
    let userProfile = null;
    let userType = "unknown";

    // Try Admin first (multiple roles supported)
    userProfile = await Admin.findOne({
      email: email.toLowerCase().trim(),
    }).select(
      "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -otpAttempts"
    );

    if (userProfile) {
      userType = "admin";
    } else {
      // If not admin, try Tutor
      userProfile = await Tutor.findOne({
        email: email.toLowerCase().trim(),
      }).select(
        "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -otpAttempts"
      );
      if (userProfile) {
        userType = "tutor";
      }
    }

    // If no matching record
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User not found in Admin or Tutor records",
      });
    }

    // Response (handles admin with multiple roles)
    return sendSuccess(res, 200, `${userType === "admin" ? "Admin" : "Tutor"} profile retrieved successfully`, {
      userType,
      role: userProfile.role,
      profile: userProfile,
    });
  } catch (error) {
    return sendError(res, 500, "Error fetching user profile", error.message);
  }
};