

import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

// File type validation per folder
const ALLOWED_FILE_TYPES = {
  audio: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/webm",
    "audio/ogg",
    "audio/aac",
  ],
  video: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/mpeg",
  ],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  images: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
};

// Allowed folders
const ALLOWED_FOLDERS = ["audio", "video", "documents", "images"];


const generateObjectKey = (fileName, folder) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const extension = sanitizedFileName.split(".").pop();
  const nameWithoutExt = sanitizedFileName.replace(`.${extension}`, "");
  
  return `${folder}/${nameWithoutExt}-${timestamp}-${randomString}.${extension}`;
};


const validateUploadRequest = (fileName, fileType, folder) => {
  // Validate folder
  if (!ALLOWED_FOLDERS.includes(folder)) {
    return {
      valid: false,
      error: `Invalid folder. Must be one of: ${ALLOWED_FOLDERS.join(", ")}`,
    };
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES[folder]?.includes(fileType)) {
    return {
      valid: false,
      error: `Invalid file type for ${folder}. Allowed types: ${ALLOWED_FILE_TYPES[folder]?.join(", ")}`,
    };
  }

  // Validate file name
  if (!fileName || fileName.trim() === "") {
    return {
      valid: false,
      error: "File name is required",
    };
  }

  return { valid: true };
};


export const startMultipartUpload = async (req, res) => {
  try {
    const S3_BUCKET = process.env.S3_BUCKET_NAME || "course-audio-bucket-schoolemy";
    const S3_REGION = process.env.AWS_REGION || "ap-south-1";

    const { fileName, fileType, folder } = req.body;

    // Validate required fields
    if (!fileName || !fileType || !folder) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: fileName, fileType, and folder",
      });
    }

    // Validate upload parameters
    const validation = validateUploadRequest(fileName, fileType, folder);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Generate unique object key
    const objectKey = generateObjectKey(fileName, folder);

    // Create multipart upload command
    const command = new CreateMultipartUploadCommand({
      Bucket: S3_BUCKET,
      Key: objectKey,
      ContentType: fileType,
      Metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
        folder: folder,
      },
    });

    // Execute command
    const response = await s3Client.send(command);

    // Generate final file URL (available after completion)
    const fileUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${objectKey}`;

    return res.status(200).json({
      success: true,
      message: "Multipart upload initiated successfully",
      data: {
        uploadId: response.UploadId,
        objectKey: objectKey,
        fileUrl: fileUrl, // Store this in your database
      },
    });
  } catch (error) {
    console.error("Error starting multipart upload:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start multipart upload",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


export const getPresignedUrlForPart = async (req, res) => {
  try {
    const S3_BUCKET = process.env.S3_BUCKET_NAME || "course-audio-bucket-schoolemy";

    const { uploadId, objectKey, partNumber } = req.body;

    // Validate required fields
    if (!uploadId || !objectKey || !partNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: uploadId, objectKey, and partNumber",
      });
    }

    // Validate part number (S3 allows 1-10000)
    if (partNumber < 1 || partNumber > 10000) {
      return res.status(400).json({
        success: false,
        message: "Part number must be between 1 and 10000",
      });
    }

    // Create command for uploading a part
    const command = new UploadPartCommand({
      Bucket: S3_BUCKET,
      Key: objectKey,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    // Generate pre-signed URL (expires in 1 hour)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return res.status(200).json({
      success: true,
      data: {
        presignedUrl: presignedUrl,
        partNumber: partNumber,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate presigned URL",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


export const completeMultipartUpload = async (req, res) => {
  try {
    const S3_BUCKET = process.env.S3_BUCKET_NAME || "course-audio-bucket-schoolemy";
    const S3_REGION = process.env.AWS_REGION || "ap-south-1";

    const { uploadId, objectKey, parts } = req.body;

    // Validate required fields
    if (!uploadId || !objectKey || !parts || !Array.isArray(parts)) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required fields: uploadId, objectKey, and parts array",
      });
    }

    // Validate parts array
    if (parts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Parts array cannot be empty",
      });
    }

    // Validate each part has ETag and PartNumber
    for (const part of parts) {
      if (!part.ETag || !part.PartNumber) {
        return res.status(400).json({
          success: false,
          message: "Each part must have ETag and PartNumber",
        });
      }
    }

    // Complete multipart upload command
    const command = new CompleteMultipartUploadCommand({
      Bucket: S3_BUCKET,
      Key: objectKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((part) => ({
          ETag: part.ETag,
          PartNumber: part.PartNumber,
        })),
      },
    });

    // Execute command
    const response = await s3Client.send(command);

    // Generate final file URL
    const fileUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${objectKey}`;

    return res.status(200).json({
      success: true,
      message: "Multipart upload completed successfully",
      data: {
        fileUrl: fileUrl,
        objectKey: objectKey,
        location: response.Location,
        bucket: response.Bucket,
        key: response.Key,
      },
    });
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete multipart upload",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


export const abortMultipartUpload = async (req, res) => {
  try {
    const { uploadId, objectKey } = req.body;

    // Validate required fields
    if (!uploadId || !objectKey) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: uploadId and objectKey",
      });
    }

    // Abort multipart upload command
    const command = new AbortMultipartUploadCommand({
      Bucket: S3_BUCKET,
      Key: objectKey,
      UploadId: uploadId,
    });

    // Execute command
    await s3Client.send(command);

    return res.status(200).json({
      success: true,
      message: "Multipart upload aborted successfully",
      data: {
        uploadId: uploadId,
        objectKey: objectKey,
      },
    });
  } catch (error) {
    console.error("Error aborting multipart upload:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to abort multipart upload",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
