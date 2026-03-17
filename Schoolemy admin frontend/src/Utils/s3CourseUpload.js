/**
 * S3 Upload Utility for Course Files
 * 
 * Provides functions to:
 * - Upload files directly to S3 using presigned URLs
 * - Bypass API Gateway's 10MB limit
 * - Support files up to 5GB
 * - Validate uploads
 * 
 * Benefits:
 * - ✅ ZERO 413 errors
 * - ✅ Real-time upload progress
 * - ✅ Supports large files (videos, audios, PDFs)
 * - ✅ Parallel upload support
 */

import api from './api';
import axios from 'axios';

/**
 * Check if S3 direct upload endpoints are available
 * 
 * @returns {Promise<boolean>} - True if S3 upload is available
 */
export const isS3Available = async () => {
  try {
    // Try to access the S3 upload endpoint
    const response = await api.options('/api/courses/generate-upload-urls', {
      validateStatus: (status) => status < 500,
    });
    return response.status !== 404;
  } catch (error) {
    // If OPTIONS fails, try HEAD or just assume it's available based on error type
    if (error.code === 'ERR_NETWORK') {
      console.warn('Network error checking S3 availability');
      return false;
    }
    // If we get any other error, assume the endpoint exists
    return true;
  }
};

/**
 * Upload a single file directly to S3 using presigned URL
 * 
 * @param {File} file - File object to upload
 * @param {string} courseName - Course name for folder structure
 * @param {string} category - File category (thumbnail, preview, audio, video, pdf)
 * @param {object} options - Additional options (chapterIndex, lessonIndex, customName)
 * @param {function} onProgress - Progress callback (percent: 0-100)
 * @returns {Promise<object>} - Upload result with S3 URL and metadata
 * 
 * @example
 * const result = await uploadFileToS3(
 *   fileObject,
 *   "Yoga for Beginners",
 *   "video",
 *   { chapterIndex: 0, lessonIndex: 0, customName: "Introduction" },
 *   (percent) => console.log(`Upload progress: ${percent}%`)
 * );
 * console.log("S3 URL:", result.url);
 */
export const uploadFileToS3 = async (
  file,
  courseName,
  category,
  options = {},
  onProgress = null
) => {
  try {
    const { chapterIndex, lessonIndex, customName } = options;

    // Step 1: Request presigned URL from backend
    console.log(`📤 Requesting presigned URL for: ${file.name}`);
    console.log(`   Course: ${courseName}`);
    console.log(`   Category: ${category}`);
    console.log(`   Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    const urlResponse = await api.post('/api/courses/generate-upload-urls', {
      courseName,
      files: [
        {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          category,
          chapterIndex,
          lessonIndex,
          customName,
        },
      ],
    });

    if (!urlResponse.data.success) {
      throw new Error(urlResponse.data.error || 'Failed to get upload URL');
    }

    const { uploadUrl, s3Url, s3Key, expiresAt } = urlResponse.data.data[0];

    console.log(`✅ Got presigned URL`);
    console.log(`   Expires: ${new Date(expiresAt).toLocaleString()}`);
    console.log(`   S3 Key: ${s3Key}`);

    // Step 2: Upload file directly to S3 (bypasses API Gateway)
    console.log(`📤 Uploading to S3...`);
    
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    console.log(`✅ Upload complete: ${file.name}`);
    console.log(`   S3 URL: ${s3Url}`);

    return {
      name: customName || file.name,
      url: s3Url,
      s3Key,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error(`❌ S3 upload failed for ${file.name}:`, error);
    
    // Provide detailed error messages
    let errorMessage = error.message;
    if (error.response?.status === 403) {
      errorMessage = `Upload permission denied. Presigned URL may have expired.`;
    } else if (error.response?.status === 400) {
      errorMessage = `Invalid upload request: ${error.response.data?.error || error.message}`;
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = `Network error during upload. Check your connection.`;
    }
    
    throw new Error(`Failed to upload ${file.name}: ${errorMessage}`);
  }
};

/**
 * Upload multiple files to S3 sequentially with progress tracking
 * 
 * @param {Array<{file: File, category: string, ...}>} files - Array of file objects with metadata
 * @param {string} courseName - Course name
 * @param {function} onProgress - Progress callback (current, total, overallPercent, fileName, filePercent)
 * @returns {Promise<Array<object>>} - Array of upload results
 * 
 * @example
 * const files = [
 *   { file: videoFile, category: 'video', chapterIndex: 0, lessonIndex: 0 },
 *   { file: audioFile, category: 'audio', chapterIndex: 0, lessonIndex: 1 }
 * ];
 * 
 * const results = await uploadMultipleFilesToS3(
 *   files,
 *   "Yoga Course",
 *   (current, total, overall, fileName, filePercent) => {
 *     console.log(`[${current}/${total}] ${fileName}: ${filePercent}% (Overall: ${overall}%)`);
 *   }
 * );
 */
export const uploadMultipleFilesToS3 = async (
  files,
  courseName,
  onProgress = null
) => {
  const results = [];
  let completed = 0;

  console.log(`📦 Starting upload of ${files.length} files for course: ${courseName}`);

  for (const fileInfo of files) {
    const { file, category, chapterIndex, lessonIndex, customName } = fileInfo;
    
    try {
      console.log(`\n[${completed + 1}/${files.length}] Uploading ${file.name}...`);
      
      const result = await uploadFileToS3(
        file,
        courseName,
        category,
        { chapterIndex, lessonIndex, customName },
        (percent) => {
          if (onProgress) {
            const overall = Math.round(((completed + percent / 100) / files.length) * 100);
            onProgress(completed + 1, files.length, overall, file.name, percent);
          }
        }
      );
      
      results.push({ ...result, success: true });
      completed++;
      
      console.log(`✅ [${completed}/${files.length}] ${file.name} uploaded successfully`);
      
      if (onProgress) {
        const overall = Math.round((completed / files.length) * 100);
        onProgress(completed, files.length, overall, file.name, 100);
      }
    } catch (error) {
      console.error(`❌ [${completed + 1}/${files.length}] Failed to upload ${file.name}:`, error);
      results.push({
        name: file.name,
        success: false,
        error: error.message,
      });
      // Continue with next file even if one fails
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Upload Summary:`);
  console.log(`   Total: ${files.length} files`);
  console.log(`   Success: ${successCount} ✅`);
  console.log(`   Failed: ${failureCount} ❌`);

  return results;
};

/**
 * Validate that files were successfully uploaded to S3
 * Checks if files exist and are accessible
 * 
 * @param {Array<string>} s3Urls - Array of S3 URLs to validate
 * @returns {Promise<object>} - Validation results
 * 
 * @example
 * const validation = await validateS3Uploads([
 *   "https://bucket.s3.region.amazonaws.com/course/video/lesson1.mp4"
 * ]);
 * 
 * if (validation.success) {
 *   console.log("All files validated!");
 * }
 */
export const validateS3Uploads = async (s3Urls) => {
  try {
    console.log(`🔍 Validating ${s3Urls.length} S3 upload(s)...`);
    
    const response = await api.post('/api/courses/validate-uploads', {
      s3Urls,
    });
    
    if (!response.data.success) {
      const failedFiles = response.data.failedUploads || [];
      console.error(`❌ Validation failed for ${failedFiles.length} file(s):`, failedFiles);
      throw new Error(response.data.message || 'Validation failed');
    }
    
    console.log(`✅ All ${s3Urls.length} file(s) validated successfully`);
    return response.data;
  } catch (error) {
    console.error('❌ S3 validation failed:', error);
    throw new Error(`Upload validation failed: ${error.message}`);
  }
};

/**
 * Get estimated upload time for a file
 * Based on average connection speed
 * 
 * @param {number} fileSizeBytes - File size in bytes
 * @param {number} speedMbps - Connection speed in Mbps (default: 10)
 * @returns {string} - Estimated time string
 */
export const getEstimatedUploadTime = (fileSizeBytes, speedMbps = 10) => {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  const speedMBps = speedMbps / 8; // Convert Mbps to MBps
  const timeSeconds = fileSizeMB / speedMBps;
  
  if (timeSeconds < 60) {
    return `~${Math.ceil(timeSeconds)} seconds`;
  } else if (timeSeconds < 3600) {
    return `~${Math.ceil(timeSeconds / 60)} minutes`;
  } else {
    return `~${Math.ceil(timeSeconds / 3600)} hours`;
  }
};
