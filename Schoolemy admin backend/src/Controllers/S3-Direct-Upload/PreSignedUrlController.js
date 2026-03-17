import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

// S3 Bucket Configuration
const S3_BUCKET = process.env.S3_BUCKET_NAME || "course-audio-bucket-schoolemy";
const S3_REGION = process.env.AWS_REGION || "ap-south-1";

// Allowed file types per folder
const ALLOWED_FILE_TYPES = {
  thumbnails: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  videos: ["video/mp4", "video/webm", "video/quicktime"],
  pdfs: ["application/pdf"],
};

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  thumbnails: 5 * 1024 * 1024, // 5 MB
  videos: 500 * 1024 * 1024, // 500 MB
  pdfs: 10 * 1024 * 1024, // 10 MB
};

/**
 * Validate file upload parameters
 * @param {string} fileName - Name of the file
 * @param {string} fileType - MIME type of the file
 * @param {string} folder - Target folder (thumbnails|videos|pdfs)
 * @param {number} fileSize - Size of file in bytes (optional)
 * @returns {object} Validation result
 */
const validateUploadParams = (fileName, fileType, folder, fileSize) => {
  // Validate folder
  if (!["thumbnails", "videos", "pdfs"].includes(folder)) {
    return {
      valid: false,
      error: "Invalid folder. Must be one of: thumbnails, videos, pdfs",
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

/**
 * Generate unique file name with timestamp
 * @param {string} fileName - Original file name
 * @returns {string} Unique file name
 */
const generateUniqueFileName = (fileName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split(".").pop();
  const nameWithoutExt = fileName.replace(`.${extension}`, "");
  return `${nameWithoutExt}-${timestamp}-${randomString}.${extension}`;
};

/**
 * Generate pre-signed URL for S3 upload
 * POST /api/s3/generate-upload-url
 */
export const generatePreSignedUploadUrl = async (req, res) => {
  try {
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

    // Generate unique file name
    const uniqueFileName = generateUniqueFileName(validation.sanitizedFileName);
    const s3Key = `${folder}/${uniqueFileName}`;

    // Create S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      ContentType: fileType,
      // Optional: Add metadata
      Metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Generate pre-signed URL (expires in 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes in seconds
    });

    // Generate public URL for database storage
    const fileUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;

    // Return both URLs
    return res.status(200).json({
      success: true,
      message: "Pre-signed URL generated successfully",
      data: {
        uploadUrl, // Client uses this for PUT request
        fileUrl, // Store this in your database
        key: s3Key, // S3 object key (useful for deletion)
        fileName: uniqueFileName,
        folder,
        expiresIn: 300, // seconds
      },
    });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate pre-signed URL",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get file upload limits
 * GET /api/s3/upload-limits
 */
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
