import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { withRetry, s3CircuitBreaker } from "../../Utils/resilience.js";
import { getMediaUrl } from "../../Utils/mediaUrl.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Initialize S3 Client
// In Lambda/production: rely on default credential chain (IAM role + session token).
// Local dev: allow explicit env credentials, including optional session token.
const config = { region: process.env.AWS_REGION || "ap-south-1" };
const isLambdaRuntime =
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  String(process.env.AWS_EXECUTION_ENV || "").includes("AWS_Lambda");
const hasExplicitCreds =
  !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;

if (hasExplicitCreds && !isLambdaRuntime) {
  config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    // Required when using temporary credentials outside Lambda.
    ...(process.env.AWS_SESSION_TOKEN
      ? { sessionToken: process.env.AWS_SESSION_TOKEN }
      : {}),
  };
}
const s3Client = new S3Client(config);

// Allowed file types per folder
const ALLOWED_FILE_TYPES = {
  thumbnails: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  videos: ["video/mp4", "video/webm", "video/quicktime"],
  pdfs: ["application/pdf"],
  banner: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  hero: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  testimonials: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  "landing-sections": ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  advertisements: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  "profile-pictures": ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  "govt-documents": ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  thumbnails: 5 * 1024 * 1024, // 5 MB
  videos: 500 * 1024 * 1024, // 500 MB
  pdfs: 10 * 1024 * 1024, // 10 MB
  banner: 10 * 1024 * 1024, // 10 MB
  hero: 10 * 1024 * 1024, // 10 MB
  testimonials: 5 * 1024 * 1024, // 5 MB
  "landing-sections": 10 * 1024 * 1024, // 10 MB
  advertisements: 5 * 1024 * 1024, // 5 MB
  "profile-pictures": 5 * 1024 * 1024, // 5 MB
  "govt-documents": 5 * 1024 * 1024, // 5 MB
};


const validateUploadParams = (fileName, fileType, folder, fileSize) => {
  // Validate folder
  if (!Object.keys(ALLOWED_FILE_TYPES).includes(folder)) {
    const validFolders = Object.keys(ALLOWED_FILE_TYPES).join(", ");
    return {
      valid: false,
      error: `Invalid folder. Must be one of: ${validFolders}`,
    };
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES[folder].includes(fileType)) {
    return {
      valid: false,
      error: `Invalid file type for ${folder}. Allowed types: ${ALLOWED_FILE_TYPES[folder].join(", ")}`,
    };
  }

  // Validate file name
  if (!fileName || fileName.trim() === "") {
    return {
      valid: false,
      error: "File name is required",
    };
  }

  // Validate file size if provided
  if (fileSize && fileSize > MAX_FILE_SIZES[folder]) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZES[folder] / (1024 * 1024)} MB for ${folder}`,
    };
  }

  // Sanitize file name (remove special characters)
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  return {
    valid: true,
    sanitizedFileName,
  };
};


const generateUniqueFileName = (fileName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split(".").pop();
  const nameWithoutExt = fileName.replace(`.${extension}`, "");
  return `${nameWithoutExt}-${timestamp}-${randomString}.${extension}`;
};

const sanitizeMetadataValue = (value = "") =>
  String(value).replace(/[^\x20-\x7E]/g, "").slice(0, 512);


// Maps upload folder to the correct S3 bucket
const FOLDER_BUCKET_MAP = {
  banner:            process.env.AWS_S3_STAFF_BUCKET || "admin-staff-profile-images",
  hero:              process.env.AWS_S3_STAFF_BUCKET || "admin-staff-profile-images",
  testimonials:      process.env.AWS_S3_STAFF_BUCKET || "admin-staff-profile-images",
  "landing-sections": process.env.AWS_S3_STAFF_BUCKET || "admin-staff-profile-images",
  advertisements:    process.env.AWS_S3_STAFF_BUCKET || "admin-staff-profile-images",
  "profile-pictures": process.env.AWS_S3_STAFF_BUCKET || "admin-staff-profile-images",
  "govt-documents":   process.env.AWS_S3_STAFF_BUCKET || "admin-staff-profile-images",
  thumbnails:        process.env.AWS_S3_BUCKET_SCHOOLEMY || "courses-audio-bucket-schoolemy",
  videos:            process.env.AWS_S3_BUCKET_SCHOOLEMY || "courses-audio-bucket-schoolemy",
  pdfs:              process.env.AWS_S3_BUCKET_SCHOOLEMY || "courses-audio-bucket-schoolemy",
};

export const generatePreSignedUploadUrl = async (req, res) => {
  try {
    const S3_REGION = process.env.AWS_REGION || "ap-south-1";

    const { fileName, fileType, folder, fileSize } = req.body;

    // Validate required fields
    if (!fileName || !fileType || !folder) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: fileName, fileType, and folder are required",
      });
    }

    // Validate upload parameters
    const validation = validateUploadParams(fileName, fileType, folder, fileSize);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Pick bucket based on folder
    const S3_BUCKET = FOLDER_BUCKET_MAP[folder] || process.env.AWS_S3_BUCKET_SCHOOLEMY || "courses-audio-bucket-schoolemy";

    // Generate unique file name
    const uniqueFileName = generateUniqueFileName(validation.sanitizedFileName);
    const s3Key = `${folder}/${uniqueFileName}`;

    const normalizedContentType = fileType || "application/octet-stream";
    const uploadMetadata = {
      originalname: sanitizeMetadataValue(fileName),
      uploadedat: new Date().toISOString(),
    };

    // Create S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      ContentType: normalizedContentType,
      Metadata: uploadMetadata,
      CacheControl: "public, max-age=31536000",
    });

    // Generate pre-signed URL (expires in 5 minutes) — with retry + circuit breaker
    const uploadUrl = await s3CircuitBreaker.call(() =>
      withRetry(() => getSignedUrl(s3Client, command, { expiresIn: 300 }), {
        attempts: 3,
        baseDelayMs: 500,
        label: "S3 presigned URL generation",
      })
    );

    // Generate public URL for database storage
    const rawS3Url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
    const s3Url = getMediaUrl(rawS3Url); // Use CDN if available

    // Return both URLs
    return res.status(200).json({
      success: true,
      message: "Pre-signed URL generated successfully",
      data: {
        uploadUrl, // Client uses this for PUT request
        s3Url, // Store this in your database (CDN-aware, also available as fileUrl for compatibility)
        fileUrl: s3Url, // Backward compatibility
        key: s3Key, // S3 object key (useful for deletion)
        fileName: uniqueFileName,
        folder,
        expiresIn: 300, // seconds
        // Client must use these headers exactly for PUT upload.
        uploadHeaders: {
          "Content-Type": normalizedContentType,
        },
        metadata: uploadMetadata,
      },
    });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    console.error("AWS Config Debug:", {
      bucket: process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_SCHOOLEMY,
      region: process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to generate pre-signed URL",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


export const getUploadLimits = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        folders: Object.keys(ALLOWED_FILE_TYPES),
        limits: {
          thumbnails: {
            allowedTypes: ALLOWED_FILE_TYPES.thumbnails,
            maxSize: MAX_FILE_SIZES.thumbnails,
            maxSizeMB: MAX_FILE_SIZES.thumbnails / (1024 * 1024),
          },
          videos: {
            allowedTypes: ALLOWED_FILE_TYPES.videos,
            maxSize: MAX_FILE_SIZES.videos,
            maxSizeMB: MAX_FILE_SIZES.videos / (1024 * 1024),
          },
          pdfs: {
            allowedTypes: ALLOWED_FILE_TYPES.pdfs,
            maxSize: MAX_FILE_SIZES.pdfs,
            maxSizeMB: MAX_FILE_SIZES.pdfs / (1024 * 1024),
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching upload limits:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch upload limits",
    });
  }
};
