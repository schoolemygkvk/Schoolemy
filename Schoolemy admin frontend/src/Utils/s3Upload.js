import { secureStorage } from './security';

/**
 * S3 Direct Upload Utility
 * 
 * REQUEST FLOW:
 * 1. Frontend calls backend: POST /s3/presigned-url (via proxy in dev)
 * 2. Backend Lambda generates presigned URL from S3
 * 3. Frontend receives presigned URL
 * 4. Frontend uploads file directly to S3 using presigned URL (PUT)
 * 
 * In development: Uses /api proxy to avoid CORS issues
 * In production: Uses direct AWS API Gateway URL
 */

// AWS API Gateway URL
const AWS_API_URL = "https://e3a24h4aa3.execute-api.ap-south-1.amazonaws.com/dev";

// Use proxy in development to fix CORS duplicate headers
const API_BASE = process.env.NODE_ENV === 'development' ? '/api' : AWS_API_URL;

// S3 upload enabled - backend must have /s3/presigned-url endpoint
let s3EndpointChecked = false;
let s3EndpointAvailable = false;

/**
 * Get auth token from secure storage
 */
const getAuthToken = () => {
  return secureStorage.getItem("token");
};

/**
 * Check if S3 upload endpoint exists on backend
 * Makes a test request to verify the endpoint is available
 */
export const checkS3Endpoint = async () => {
  if (s3EndpointChecked) return s3EndpointAvailable;
  
  const token = getAuthToken();
  const url = `${API_BASE}/s3/presigned-url`;
  
  console.log(`[S3] Checking endpoint: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        filename: 'test.txt',
        contentType: 'text/plain',
        folder: 'test',
      }),
    });
    
    s3EndpointChecked = true;
    
    if (response.status === 404) {
      s3EndpointAvailable = false;
      console.log('[S3] ⚠️ Endpoint /s3/presigned-url NOT found (404) - using fallback');
    } else if (response.ok) {
      s3EndpointAvailable = true;
      console.log('[S3] ✅ Endpoint available');
    } else {
      // Other errors (401, 500, etc) - assume endpoint exists but has issues
      s3EndpointAvailable = false;
      console.log(`[S3] ⚠️ Endpoint returned ${response.status} - using fallback`);
    }
  } catch (error) {
    s3EndpointChecked = true;
    s3EndpointAvailable = false;
    console.log('[S3] ⚠️ Network error checking endpoint:', error.message);
  }
  
  return s3EndpointAvailable;
};

/**
 * Get a pre-signed URL from backend (via proxy in dev)
 * 
 * Request: POST /api/s3/presigned-url (dev) or direct AWS URL (prod)
 * Response: { uploadUrl: "https://bucket.s3.amazonaws.com/...", fileUrl: "...", key: "..." }
 */
export const getPresignedUrl = async (filename, contentType, folder = 'uploads') => {
  const token = getAuthToken();
  const url = `${API_BASE}/s3/presigned-url`;
  
  console.log(`[S3] Requesting presigned URL: ${url}`);
  console.log(`[S3] File: ${filename}, Type: ${contentType}, Folder: ${folder}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify({
      filename,
      contentType,
      folder,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[S3] ❌ Failed to get presigned URL: ${response.status}`, errorText);
    throw new Error(`Failed to get presigned URL: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('[S3] ✅ Got presigned URL:', data.uploadUrl?.substring(0, 100) + '...');
  
  return data;
};

/**
 * Upload a file directly to S3 using the presigned URL
 * Uses fetch() for the PUT request to S3
 * 
 * Request: PUT https://bucket.s3.ap-south-1.amazonaws.com/key?X-Amz-...
 * Headers: Content-Type must match the presigned URL's content type
 */
export const uploadToS3 = async (file, uploadUrl, onProgress = () => {}) => {
  if (!uploadUrl) {
    throw new Error('Upload URL is undefined - presigned URL request may have failed');
  }
  
  console.log(`[S3] Uploading to S3: ${uploadUrl.substring(0, 80)}...`);
  
  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
        console.log(`[S3] Upload progress: ${percent}%`);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('[S3] ✅ S3 upload successful');
        resolve();
      } else {
        console.error(`[S3] ❌ S3 upload failed: ${xhr.status} ${xhr.statusText}`);
        reject(new Error(`S3 upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      console.error('[S3] ❌ Network error during S3 upload');
      reject(new Error('S3 upload failed due to network error'));
    });
    
    xhr.addEventListener('abort', () => reject(new Error('S3 upload was cancelled')));

    xhr.open('PUT', uploadUrl);
    // Content-Type header must match what was used to generate the presigned URL
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
};

/**
 * Upload a single file to S3 via presigned URL
 * 
 * Flow:
 * 1. Call backend to get presigned URL
 * 2. Upload file directly to S3
 * 3. Return the final S3 file URL
 */
export const uploadFileToS3 = async (file, folder = 'uploads', onProgress = () => {}) => {
  console.log(`[S3] === Starting S3 upload ===`);
  console.log(`[S3] File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  console.log(`[S3] Folder: ${folder}`);
  
  // Step 1: Get presigned URL from backend
  const presignedData = await getPresignedUrl(file.name, file.type, folder);
  
  if (!presignedData || !presignedData.uploadUrl) {
    throw new Error('Backend did not return a valid presigned URL');
  }
  
  const { uploadUrl, fileUrl, key } = presignedData;
  
  // Step 2: Upload directly to S3
  await uploadToS3(file, uploadUrl, onProgress);
  
  console.log(`[S3] ✅ Upload complete: ${file.name}`);
  console.log(`[S3] File URL: ${fileUrl}`);
  
  return {
    url: fileUrl,
    key: key,
    name: file.name,
    filename: file.name,
    size: file.size,
    type: file.type,
  };
};

/**
 * Check if S3 direct upload is available
 */
export const isS3Available = async () => {
  return await checkS3Endpoint();
};

/**
 * Reset the endpoint check (useful for testing)
 */
export const resetS3Check = () => {
  s3EndpointChecked = false;
  s3EndpointAvailable = false;
};

const s3Upload = {
  getPresignedUrl,
  uploadToS3,
  uploadFileToS3,
  isS3Available,
  checkS3Endpoint,
  resetS3Check,
};

export default s3Upload;
