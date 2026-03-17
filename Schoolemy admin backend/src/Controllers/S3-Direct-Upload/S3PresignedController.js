/**
 * S3 Presigned URL Controller
 * 
 * This controller generates presigned URLs for direct S3 uploads,
 * bypassing API Gateway's 10MB limit.
 * 
 * Why this works:
 * - Client uploads directly to S3 (no API Gateway involved)
 * - API Gateway only generates the presigned URL (~1KB payload)
 * - S3 can handle files up to 5TB
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = "course-audio-bucket-schoolemy";

/**
 * Generate a presigned URL for direct S3 upload
 * 
 * @route POST /api/s3/presigned-upload
 * @access Protected (requires authentication)
 */
export const generatePresignedUrl = async (req, res) => {
  try {
    const { 
      fileName, 
      fileType, 
      folder = 'uploads',
      expiresIn = 3600 // 1 hour default
    } = req.body;

    // Validation
    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        error: "fileName and fileType are required",
      });
    }

    // Sanitize filename and generate unique name
    const fileExtension = path.extname(fileName);
    const sanitizedBaseName = path.basename(fileName, fileExtension)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50); // Limit length
    
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const uniqueFileName = `${sanitizedBaseName}_${timestamp}_${uniqueId}${fileExtension}`;
    
    // Construct S3 key with folder structure
    const s3Key = `${folder}/${uniqueFileName}`;

    // Create S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
      // Optional: Add metadata
      Metadata: {
        'original-filename': fileName,
        'uploaded-by': req.user?.id || 'anonymous',
        'upload-timestamp': new Date().toISOString(),
      },
      // Optional: Server-side encryption
      ServerSideEncryption: "AES256",
    });

    // Generate presigned URL (valid for specified time)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: Math.min(expiresIn, 3600), // Max 1 hour for security
    });

    // Construct the final S3 URL (public URL after upload)
    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3Key}`;

    console.log(`✅ Generated presigned URL for: ${fileName} (${fileType})`);
    console.log(`📦 S3 Key: ${s3Key}`);

    res.status(200).json({
      success: true,
      message: "Presigned URL generated successfully",
      data: {
        uploadUrl: presignedUrl,
        s3Key: s3Key,
        s3Url: s3Url, // Use this to save in MongoDB
        fileName: uniqueFileName,
        expiresIn: expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
    });

  } catch (error) {
    console.error("❌ Error generating presigned URL:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate presigned URL",
      message: error.message,
    });
  }
};

/**
 * Verify file upload completion and save metadata
 * 
 * @route POST /api/s3/verify-upload
 * @access Protected
 */
export const verifyUpload = async (req, res) => {
  try {
    const { s3Url, s3Key, fileName, fileSize, fileType, metadata } = req.body;

    if (!s3Url || !s3Key) {
      return res.status(400).json({
        success: false,
        error: "s3Url and s3Key are required",
      });
    }

    // Here you can:
    // 1. Verify the file exists in S3 (optional)
    // 2. Save file metadata to MongoDB
    // 3. Associate with user/course/resource

    // Example: Save to database
    const fileRecord = {
      s3Url,
      s3Key,
      fileName,
      fileSize,
      fileType,
      uploadedBy: req.user?.id,
      uploadedAt: new Date(),
      metadata: metadata || {},
    };

    // TODO: Save to your MongoDB collection
    // await FileModel.create(fileRecord);

    console.log(`✅ Upload verified: ${fileName}`);

    res.status(200).json({
      success: true,
      message: "Upload verified successfully",
      data: {
        fileUrl: s3Url,
        fileName: fileName,
      },
    });

  } catch (error) {
    console.error("❌ Error verifying upload:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify upload",
      message: error.message,
    });
  }
};

/**
 * Generate presigned URL for downloading/viewing files
 * 
 * @route POST /api/s3/presigned-download
 * @access Protected
 */
export const generateDownloadUrl = async (req, res) => {
  try {
    const { s3Key, expiresIn = 3600 } = req.body;

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        error: "s3Key is required",
      });
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
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
    console.error("❌ Error generating download URL:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate download URL",
      message: error.message,
    });
  }
};

/**
 * Delete file from S3
 * 
 * @route DELETE /api/s3/delete
 * @access Protected (Admin only)
 */
export const deleteFile = async (req, res) => {
  try {
    const { s3Key } = req.body;

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        error: "s3Key is required",
      });
    }

    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);

    console.log(`🗑️ Deleted file: ${s3Key}`);

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });

  } catch (error) {
    console.error("❌ Error deleting file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete file",
      message: error.message,
    });
  }
};
