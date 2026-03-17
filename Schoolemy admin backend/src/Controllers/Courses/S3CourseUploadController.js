/**
 * S3 Course Upload Controller
 * 
 * Generates presigned URLs for direct S3 uploads, bypassing API Gateway's 10MB limit.
 * Specifically designed for course file uploads (videos, audios, PDFs, thumbnails).
 * 
 * Why this works:
 * - Client uploads files directly to S3 (no API Gateway involved)
 * - API Gateway only generates presigned URLs (~1KB payload)
 * - Supports files up to 5GB (single upload) or 5TB (multipart)
 * - ZERO 413 errors
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";

// Initialize S3 Client
// Lambda: Use default credential chain (IAM role) - NEVER pass explicit creds for temp/session tokens
// Local: Use S3_* or AWS_* env vars when set (long-term IAM user keys)
const isLambda = process.env.NODE_ENV === "lambda";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const hasExplicitCreds = accessKeyId && secretAccessKey;

// Only use explicit credentials when NOT Lambda AND we have long-term keys (AKIA...)
// Lambda's AWS_ACCESS_KEY_ID starts with ASIA (temp) - must use default chain to get session token
const useExplicitCreds = !isLambda && hasExplicitCreds;

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  requestChecksumCalculation: process.env.AWS_REQUEST_CHECKSUM_CALCULATION || "WHEN_REQUIRED",
  ...(useExplicitCreds
    ? {
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }
    : {}),
});

const ADMIN_BUCKET = process.env.AWS_S3_BUCKET_SCHOOLEMY || "course-audio-bucket-schoolemy";
const TUTOR_BUCKET = process.env.AWS_S3_BUCKET_TUTOR || "course-audio-bucket-tutors";

/**
 * Generate presigned URLs specifically for course file uploads
 * Supports: videos, audios, PDFs, thumbnails, preview videos
 * 
 * @route POST /api/courses/generate-upload-urls
 * @access Protected (requires authentication)
 * 
 * @example
 * POST /api/courses/generate-upload-urls
 * {
 *   "courseName": "Yoga for Beginners",
 *   "files": [
 *     {
 *       "fileName": "lesson1.mp4",
 *       "fileType": "video/mp4",
 *       "fileSize": 150000000,
 *       "category": "video",
 *       "chapterIndex": 0,
 *       "lessonIndex": 0,
 *       "customName": "Introduction Video"
 *     }
 *   ]
 * }
 */
export const generateCourseUploadUrls = async (req, res) => {
  try {
    // Lambda uses IAM role. Local dev needs S3_ACCESS_KEY_ID & S3_SECRET_ACCESS_KEY in .env
    if (!isLambda && (!accessKeyId || !secretAccessKey)) {
      console.error("❌ S3 credentials missing for local dev. Set S3_ACCESS_KEY_ID & S3_SECRET_ACCESS_KEY in .env");
      return res.status(500).json({
        success: false,
        error: "S3 credentials not configured",
        details: "Add S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY to your .env file for local development",
      });
    }

    const { courseName, files, bucketType = "admin" } = req.body;

    const BUCKET_NAME = bucketType === "tutor" ? TUTOR_BUCKET : ADMIN_BUCKET;
    
    if (!courseName || !files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "courseName and files array are required",
      });
    }

    console.log(`📦 Generating ${files.length} presigned URLs for course: ${courseName} (bucket: ${BUCKET_NAME})`);

    const results = await Promise.all(
      files.map(async (fileInfo) => {
        const {
          fileName,
          fileType,
          fileSize,
          category, // 'thumbnail', 'preview', 'audio', 'video', 'pdf'
          chapterIndex,
          lessonIndex,
          customName,
        } = fileInfo;

        if (!fileName || !category) {
          throw new Error("Each file must have fileName and category");
        }

        // Determine folder structure
        const courseFolder = courseName.toLowerCase().replace(/\s+/g, "-");
        let folder = `${courseFolder}/${category}`;

        // Use custom name if provided (preserves UTF-8)
        const baseName = customName 
          ? path.basename(customName, path.extname(customName))
          : path.basename(fileName, path.extname(fileName));
        
        const ext = path.extname(fileName);
        const timestamp = Date.now();
        const uniqueId = crypto.randomBytes(4).toString('hex');
        const uniqueFileName = `${baseName}_${timestamp}_${uniqueId}${ext}`;
        const s3Key = `${folder}/${uniqueFileName}`;

        // Determine expiration based on file size
        // Larger files need more time for slow connections
        const expirationTime = fileSize > 100 * 1024 * 1024 ? 7200 : 3600; // 2h for >100MB, 1h otherwise

        // Use application/octet-stream - client MUST send exact same Content-Type (prevents 403)
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          ContentType: "application/octet-stream",
        });

        const uploadUrl = await getSignedUrl(s3Client, command, {
          expiresIn: expirationTime,
        });

        // Construct final S3 URL (public URL after upload)
        const keyParts = s3Key.split('/');
        const encodedKeyParts = keyParts.map(part => encodeURIComponent(part));
        const encodedKey = encodedKeyParts.join('/');
        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodedKey}`;

        console.log(`✅ Generated URL for: ${uniqueFileName} (expires in ${expirationTime/60}min)`);

        return {
          originalFileName: fileName,
          uploadUrl,
          s3Url,
          s3Key,
          contentType: "application/octet-stream",
          expiresIn: expirationTime,
          expiresAt: new Date(Date.now() + expirationTime * 1000).toISOString(),
          category,
          chapterIndex,
          lessonIndex,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: `Generated ${results.length} presigned URLs`,
      data: results,
    });
  } catch (error) {
    console.error("❌ Error generating course upload URLs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate upload URLs",
      details: error.message,
    });
  }
};

/**
 * Validate that files were successfully uploaded to S3
 * Checks if files exist and returns metadata
 * 
 * @route POST /api/courses/validate-uploads
 * @access Protected (requires authentication)
 * 
 * @example
 * POST /api/courses/validate-uploads
 * {
 *   "s3Urls": [
 *     "https://course-audio-bucket-schoolemy.s3.ap-south-1.amazonaws.com/yoga-course/video/lesson1.mp4"
 *   ]
 * }
 */
export const validateCourseUploads = async (req, res) => {
  try {
    const { s3Urls } = req.body;

    if (!s3Urls || !Array.isArray(s3Urls)) {
      return res.status(400).json({
        success: false,
        error: "s3Urls array is required",
      });
    }

    console.log(`🔍 Validating ${s3Urls.length} S3 uploads`);

    const results = await Promise.all(
      s3Urls.map(async (s3Url) => {
        try {
          const url = new URL(s3Url);
          const key = decodeURIComponent(url.pathname.substring(1));
          // Extract bucket from URL (e.g., bucket-name.s3.region.amazonaws.com)
          const bucketFromUrl = url.hostname.split(".")[0];

          const command = new HeadObjectCommand({
            Bucket: bucketFromUrl,
            Key: key,
          });

          const response = await s3Client.send(command);

          console.log(`✅ Validated: ${key} (${(response.ContentLength / 1024 / 1024).toFixed(2)}MB)`);

          return {
            url: s3Url,
            exists: true,
            size: response.ContentLength,
            contentType: response.ContentType,
            lastModified: response.LastModified,
          };
        } catch (error) {
          console.error(`❌ Validation failed for: ${s3Url}`, error.message);
          return {
            url: s3Url,
            exists: false,
            error: error.message,
          };
        }
      })
    );

    const allValid = results.every((r) => r.exists);
    const failedUploads = results.filter((r) => !r.exists);

    if (!allValid) {
      return res.status(400).json({
        success: false,
        message: "Some files failed validation",
        results,
        failedUploads,
      });
    }

    console.log(`✅ All ${s3Urls.length} file(s) validated successfully`);

    res.status(200).json({
      success: true,
      message: "All files validated successfully",
      results,
    });
  } catch (error) {
    console.error("❌ Error validating uploads:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate uploads",
      details: error.message,
    });
  }
};
