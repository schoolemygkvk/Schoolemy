import  logger  from "./logger.js";

// **
//  * Cloud Storage Service
//  * Handles uploading and managing profile images in cloud storage (AWS S3, Cloudinary, or similar)
//  * Replaces Base64 storage to reduce database document size and improve performance
//  *
//  * MIGRATION NOTE: This service is part of fixing Issue 2.1.8 (Base64 bloat)
//  * SECURITY FIX 3.28.1: Replaced mock local /uploads with production-ready AWS S3 integration
//  */

import sharp from "sharp";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { S3Client } from "@aws-sdk/client-s3";

// SECURITY FIX 3.28.1: AWS S3 integration for production cloud storage
// Prevents data loss from local disk storage and enables scalable cloud CDN
const s3BucketName = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
const useS3 = process.env.USE_AWS_S3 === "true" && s3BucketName;

let s3Client = null;
if (useS3) {
  const s3Config = { region: process.env.AWS_REGION || "ap-south-1" };

  const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
  const hasStaticCreds = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

  if (hasStaticCreds && !isLambda) {
    s3Config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
    logger.debug("Using static AWS credentials (dev environment)");
  } else if (isLambda) {
    // In Lambda, rely on AWS SDK default credential chain (execution role).
    logger.debug("Using Lambda execution role credentials");
  }
  s3Client = new S3Client(s3Config);
}

// Generate a unique filename for cloud storage
const generateImageFileName = (userId, originalFilename) => {
  // Format: user-[userId]-[timestamp]-[random].jpg
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  const extension = "jpg"; // We convert all images to JPEG
  return `profile-images/user-${userId}/${timestamp}-${random}.${extension}`;
};

export const generatePresignedUploadUrl = async (userId, fileName, fileType) => {
  if (!useS3) {
    throw new Error("S3 is not configured. Set USE_AWS_S3=true and AWS_S3_BUCKET");
  }

  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");

  const ext = fileName?.split(".").pop() || "jpg";
  const key = generateImageFileName(userId, fileName);

  const client = s3Client || createRoleBasedS3Client();
  const command = new PutObjectCommand({
    Bucket: s3BucketName,
    Key: key,
    ContentType: fileType || "image/jpeg",
  });

  try {
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    const fileUrl = `https://${s3BucketName}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${key}`;

    logger.debug("Presigned upload URL generated for user:", userId);
    return {
      uploadUrl,
      fileUrl,
      key,
      expiresIn: 300,
      uploadHeaders: {
        "Content-Type": fileType || "image/jpeg",
      },
    };
  } catch (error) {
    logger.error("Failed to generate presigned URL:", error.message);
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
};


export const uploadProfileImageToCloud = async (
  buffer,
  userId,
  originalFilename,
  skipOptimization = false,
) => {
  try {
    // Step 1: Optimize image (resize & compress) — skip for HEIC to avoid Lambda libheif issues
    let uploadBuffer = buffer;

    if (!skipOptimization) {
      try {
        uploadBuffer = await sharp(buffer)
          .resize({ width: 512, height: 512, fit: "inside" })
          .jpeg({ quality: 85 })
          .toBuffer();
      } catch (sharpError) {
        // Sharp may fail on Lambda due to broken binaries — fall back to raw buffer
        logger.warn("Sharp optimization failed, uploading raw buffer instead:", sharpError.message);
        uploadBuffer = buffer;
      }
    } else {
      logger.debug("Skipping sharp optimization (HEIC format or other reason)");
    }

    const optimizedBuffer = uploadBuffer;

    // Step 2: Generate unique filename
    const cloudFileName = generateImageFileName(userId, originalFilename);

    // Step 3: Upload to cloud storage (S3 or fallback to local dev)
    let cloudUrl;
    if (useS3 && s3Client) {
      cloudUrl = await uploadToS3(cloudFileName, optimizedBuffer);
    } else if (process.env.NODE_ENV !== "production") {
      // SECURITY FIX 3.28.1: Local fallback for development ONLY
      // In production, local /uploads is not secure (data loss on redeploy)
      logger.warn(
        "WARNING: Using local storage for uploads. This is NOT recommended in production. " +
        "Set USE_AWS_S3=true and AWS_S3_BUCKET=your-bucket-name for production cloud storage.",
      );
      cloudUrl = await mockCloudUpload(cloudFileName, optimizedBuffer);
    } else {
      throw new Error(
        "Production deployment requires AWS S3 configuration. " +
        "Set USE_AWS_S3=true, AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY",
      );
    }

    // Step 4: Return URL for database storage
    return {
      success: true,
      imageUrl: cloudUrl,
      filename: cloudFileName,
      size: Math.round(optimizedBuffer.length / 1024), // Size in KB
    };
  } catch (error) {
    logger.error("Cloud upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};


const uploadToS3 = async (filename, buffer) => {
  try {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");

    if (!s3Client) {
      throw new Error("S3 client is not initialized. Check AWS configuration.");
    }

    const command = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: filename,
      Body: buffer,
      ContentType: "image/jpeg",
      Metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);
    logger.debug("Successfully uploaded to S3:", filename);

    // Return the public S3 URL (or CloudFront URL if configured)
    const s3Url =
      process.env.AWS_CLOUDFRONT_URL ||
      `https://${s3BucketName}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com`;

    return `${s3Url}/${filename}`;
  } catch (error) {
    logger.error("S3 upload failed:", error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};


const mockCloudUpload = async (filename, buffer) => {
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsRoot, ...filename.split("/"));
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);

  const publicBase = (
    process.env.API_PUBLIC_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 8000}`
  ).replace(/\/$/, "");

  const webPath = filename.split(path.sep).join("/");
  return `${publicBase}/uploads/${webPath}`;
};


export const deleteProfileImageFromCloud = async (imageUrl) => {
  try {
    if (!imageUrl) return { success: true };

    // S3 deletion
    if (useS3 && s3Client) {
      try {
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

        // Extract S3 key from URL: https://bucket.s3.region.amazonaws.com/profile-images/user-xxx/file.jpg
        let key;
        const bucketName = s3BucketName;
        const s3BaseUrl = `https://${bucketName}.s3`;

        if (imageUrl.includes(s3BaseUrl)) {
          // S3 direct URL format
          key = imageUrl.split(`${bucketName}/`)[1];
        } else if (imageUrl.includes("cloudfront")) {
          // CloudFront URL format (distribution.cloudfront.net/profile-images/...)
          key = imageUrl.split("/").slice(-3).join("/"); // Get last 3 segments
        }

        if (!key) {
          logger.warn("Could not parse S3 key from URL:", imageUrl);
          return { success: false, error: "Invalid S3 URL format" };
        }

        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        });

        await s3Client.send(command);
        logger.debug("Deleted old profile image from S3:", key);
        return { success: true };
      } catch (s3Error) {
        logger.warn("S3 deletion failed (non-critical):", s3Error.message);
        return { success: false, error: s3Error.message };
      }
    }

    // Local fallback deletion (development)
    if (process.env.NODE_ENV !== "production") {
      const uploadsRoot = path.join(process.cwd(), "uploads");
      const relativePath = imageUrl.split("/uploads/")[1];
      if (relativePath) {
        const filePath = path.join(uploadsRoot, ...relativePath.split("/"));
        try {
          await fs.unlink(filePath);
          logger.debug("Deleted old local profile image:", filePath);
          return { success: true };
        } catch (err) {
          if (err.code !== "ENOENT") {
            logger.warn("Could not delete local file:", err.message);
          }
          return { success: true }; // Non-critical
        }
      }
    }

    return { success: true };
  } catch (error) {
    logger.error("Cloud deletion error:", error);
    return { success: false, error: error.message };
  }
};


export const getProfileImageUrl = (filename) => {
  // For public URLs, return the URL directly
  return `https://cdn.schoolemy.com/${filename}`;

  // For private URLs with expiration (S3 signed URLs):
  // const s3 = new AWS.S3();
  // return s3.getSignedUrl("getObject", {
  //   Bucket: process.env.AWS_S3_BUCKET,
  //   Key: filename,
  //   Expires: 3600, // 1 hour
  // });
};

export default {
  uploadProfileImageToCloud,
  deleteProfileImageFromCloud,
  getProfileImageUrl,
};
