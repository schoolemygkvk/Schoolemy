

import api from './api';


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
    console.log(`Requesting presigned URL for: ${file.name}`);
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

    const { uploadUrl, s3Url, s3Key, expiresAt, contentType: signedContentType } =
      urlResponse.data.data[0];

    console.log(`Got presigned URL`);
    console.log(`   Expires: ${new Date(expiresAt).toLocaleString()}`);
    console.log(`   S3 Key: ${s3Key}`);

    // Step 2: Upload file directly to S3 (bypasses API Gateway)
    console.log(`Uploading to S3...`);
    
    await api.put(uploadUrl, file, {
      noAuth: true,
      headers: {
        'Content-Type': signedContentType || file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    console.log(`Upload complete: ${file.name}`);
    console.log(`   S3 URL: ${s3Url}`);

    return {
      name: customName || file.name,
      url: s3Url,
      s3Key,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error(`S3 upload failed for ${file.name}:`, error);
    
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


export const uploadMultipleFilesToS3 = async (
  files,
  courseName,
  onProgress = null
) => {
  const results = [];
  let completed = 0;

  console.log(`Starting upload of ${files.length} files for course: ${courseName}`);

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
      
      console.log(`[${completed}/${files.length}] ${file.name} uploaded successfully`);
      
      if (onProgress) {
        const overall = Math.round((completed / files.length) * 100);
        onProgress(completed, files.length, overall, file.name, 100);
      }
    } catch (error) {
      console.error(`[${completed + 1}/${files.length}] Failed to upload ${file.name}:`, error);
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
  
  console.log(`\nUpload Summary:`);
  console.log(`   Total: ${files.length} files`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failureCount}`);

  return results;
};


export const validateS3Uploads = async (s3Urls) => {
  try {
    console.log(`Validating ${s3Urls.length} S3 upload(s)...`);
    
    const response = await api.post('/api/courses/validate-uploads', {
      s3Urls,
    });
    
    if (!response.data.success) {
      const failedFiles = response.data.failedUploads || [];
      console.error(`Validation failed for ${failedFiles.length} file(s):`, failedFiles);
      throw new Error(response.data.message || 'Validation failed');
    }
    
    console.log(`All ${s3Urls.length} file(s) validated successfully`);
    return response.data;
  } catch (error) {
    console.error('S3 validation failed:', error);
    throw new Error(`Upload validation failed: ${error.message}`);
  }
};


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
