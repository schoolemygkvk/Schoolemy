

import api from './api';

const ALLOWED_S3_FOLDERS = new Set([
  'thumbnails',
  'videos',
  'pdfs',
  'banner',
  'hero',
  'testimonials',
  'landing-sections',
  'advertisements',
  'profile-pictures',
  'govt-documents',
]);

// Backward-compatible aliases used in older forms/pages.
const FOLDER_ALIASES = {
  'event-covers': 'banner',
  'tutors/profile': 'profile-pictures',
  'tutors/documents': 'govt-documents',
};

const normalizeS3Folder = (folder) => {
  const normalized = FOLDER_ALIASES[folder] || folder;
  if (!ALLOWED_S3_FOLDERS.has(normalized)) {
    throw new Error(
      `Invalid folder "${folder}". Allowed folders: ${Array.from(ALLOWED_S3_FOLDERS).join(', ')}`
    );
  }
  return normalized;
};

export const getPresignedUrl = async (fileName, fileType, folder) => {
  try {
    const normalizedFolder = normalizeS3Folder(folder);
    const response = await api.post('/api/s3/generate-upload-url', {
      fileName,
      fileType,
      folder: normalizedFolder,
      fileSize: 0,
    });

    return response.data.data;
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    throw new Error(error.response?.data?.message || 'Failed to get presigned URL');
  }
};


export const uploadFileToS3 = async (presignedUrl, file) => {
  try {
    // Only Content-Type (already in signature)
    const response = await api.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      noAuth: true,
      transformRequest: [(data) => data],
    });

    return {
      success: true,
      status: response.status,
      message: 'File uploaded successfully',
    };
  } catch (error) {
    console.error('S3 upload error:', error);

    if (error.response?.status === 403) {
      throw new Error(
        'S3 Upload Failed (403 Forbidden). Possible causes:\n' +
        '1. Presigned URL expired (regenerate)\n' +
        '2. Content-Type mismatch (use file.type)\n' +
        '3. Extra headers sent (remove x-amz-meta-*)\n' +
        '4. IAM role lacks s3:PutObject permission\n' +
        '5. CORS not configured on bucket'
      );
    }

    throw new Error(
      error.response?.data?.message ||
      `Upload failed: ${error.response?.status || error.message}`
    );
  }
};


export const uploadToS3 = async (file, folder) => {
  try {
    if (!file) throw new Error('File is required');
    if (!folder) throw new Error('Folder is required');
    const normalizedFolder = normalizeS3Folder(folder);

    console.log(`Starting S3 upload: ${file.name} -> ${normalizedFolder}`);

    // Step 1: Get presigned URL
    const { uploadUrl, s3Url, expiresIn, uploadHeaders } = await getPresignedUrl(
      file.name,
      file.type,
      normalizedFolder
    );

    console.log(`Got presigned URL (expires in ${expiresIn}s)`);

    // Step 2: Upload file
    await api.put(uploadUrl, file, {
      headers: uploadHeaders || { 'Content-Type': file.type || 'application/octet-stream' },
      noAuth: true,
      transformRequest: [(data) => data],
    });

    console.log('File uploaded successfully');
    console.log(`S3 URL: ${s3Url}`);

    return {
      success: true,
      s3Url,
    };
  } catch (error) {
    console.error('S3 upload failed:', error.message);
    throw error;
  }
};
