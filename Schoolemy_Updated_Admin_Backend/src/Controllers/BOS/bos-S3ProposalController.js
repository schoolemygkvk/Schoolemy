import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import s3 from "../../DB/adudios3.js";
import { getMediaUrl } from "../../Utils/mediaUrl.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "admin-staff-profile-images";


export const generateProposalPresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType, expiresIn = 3600 } = req.body;

    // Validation
    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        error: "fileName and fileType are required",
      });
    }

    // Only allow PDF files
    if (fileType !== "application/pdf" && !fileName.endsWith(".pdf")) {
      return res.status(400).json({
        success: false,
        error: "Only PDF files are allowed",
      });
    }

    // Sanitize filename and generate unique name
    const fileExtension = path.extname(fileName);
    const sanitizedBaseName = path.basename(fileName, fileExtension)
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);

    const uniqueId = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const uniqueFileName = `${sanitizedBaseName}_${timestamp}_${uniqueId}${fileExtension}`;

    // Construct S3 key with folder structure
    const s3Key = `bos-proposals/${uniqueFileName}`;

    // Create S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
      Metadata: {
        "original-filename": fileName,
        "uploaded-by": req.user?.id || "anonymous",
        "upload-timestamp": new Date().toISOString(),
        "type": "course-proposal",
      },
      ServerSideEncryption: "AES256",
    });

    // Generate presigned URL (valid for specified time)
    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: Math.min(expiresIn, 3600), // Max 1 hour for security
    });

    // Construct the final S3 URL (public URL after upload)
    const region = process.env.AWS_REGION || "ap-south-1";
    const rawS3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;
    const s3Url = getMediaUrl(rawS3Url); // Use CDN if available

    res.status(200).json({
      success: true,
      message: "Presigned URL generated successfully",
      data: {
        uploadUrl: presignedUrl,
        s3Key: s3Key,
        s3Url: s3Url, // Use this to save in MongoDB (CDN-aware)
        fileName: uniqueFileName,
        expiresIn: expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate presigned URL",
      message: error.message,
    });
  }
};


export const generateProposalDownloadUrl = async (req, res) => {
  try {
    const { s3Key, expiresIn = 3600 } = req.body;

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        error: "s3Key is required",
      });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: Math.min(expiresIn, 3600),
    });

    res.status(200).json({
      success: true,
      data: {
        downloadUrl: presignedUrl,
        expiresIn: expiresIn,
      },
    });
  } catch (error) {
    console.error("Error generating download URL:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate download URL",
      message: error.message,
    });
  }
};


export const deleteProposalFile = async (req, res) => {
  try {
    const { s3Key } = req.body;

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        error: "s3Key is required",
      });
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    await s3.send(command);

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete file",
      message: error.message,
    });
  }
};
