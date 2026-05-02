import { useState } from 'react';
import axios from '../Utils/api';


export const useS3Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);

 
  const getPresignedUrls = async (courseName, files, bucketType = 'admin') => {
    try {
      console.log(`📋 Requesting ${files.length} presigned URLs from backend...`);

      const filesData = files.map(file => ({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        category: file.category || 'audio', // Can be: audio, video, pdf, thumbnail, preview
        customName: file.customName || file.name.split('.')[0],
        chapterIndex: file.chapterIndex ?? 0,
        lessonIndex: file.lessonIndex ?? 0,
      }));

      const response = await axios.post('/api/courses/generate-upload-urls', {
        courseName,
        files: filesData,
        bucketType,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to generate presigned URLs');
      }

      console.log(`✅ Received ${response.data.data.length} presigned URLs`);
      return response.data.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to get presigned URLs';
      console.error('❌ Presigned URL error:', errorMsg);
      setError(errorMsg);
      throw err;
    }
  };

 
  const uploadFileToS3 = async (file, uploadUrl, fileIndex, onProgress, contentType) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          if (onProgress) {
            onProgress(percentComplete);
          }
          setUploadProgress(prev => ({
            ...prev,
            [fileIndex]: percentComplete,
          }));
        }
      });

      // Success
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log(`✅ File uploaded successfully: ${file.name}`);
          resolve({
            success: true,
            status: xhr.status,
            etag: xhr.getResponseHeader('etag'),
          });
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      // Failure
      xhr.addEventListener('error', () => {
        console.error(`❌ Network error uploading ${file.name}`);
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        console.warn(`⚠️ Upload cancelled for ${file.name}`);
        reject(new Error('Upload cancelled'));
      });

      // Important: Include Content-Type header
      // This must match what was signed by backend
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', contentType || file.type || 'application/octet-stream');

      // Send file directly to S3 presigned URL
      xhr.send(file);
    });
  };

 
  const validateUploads = async (s3Urls) => {
    try {
      if (!s3Urls || s3Urls.length === 0) {
        return { success: true, data: [] };
      }

      console.log(`🔍 Validating ${s3Urls.length} uploaded files on S3...`);

      const response = await axios.post('/api/courses/validate-uploads', {
        s3Urls,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Validation failed');
      }

      console.log(`✅ All uploads validated successfully`);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Validation failed';
      console.error('❌ Validation error:', errorMsg);
      setError(errorMsg);
      throw err;
    }
  };


  const uploadToS3 = async (courseName, files, bucketType = 'admin') => {
    if (!files || files.length === 0) {
      setError('No files selected');
      return null;
    }

    setUploading(true);
    setError(null);
    setUploadProgress({});

    try {
      // Step 1: Get presigned URLs from backend
      const presignedData = await getPresignedUrls(courseName, files, bucketType);

      // Step 2: Upload files to S3 sequentially
      console.log(`📤 Uploading ${files.length} files to S3...`);
      const uploadResults = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const urlData = presignedData[i];

        try {
          console.log(`Uploading file ${i + 1}/${files.length}: ${file.name}`);

          await uploadFileToS3(
            file,
            urlData.uploadUrl,
            i,
            (progress) => {
              console.log(`${file.name}: ${progress.toFixed(0)}%`);
            },
            urlData.contentType,
          );

          uploadResults.push({
            success: true,
            fileName: urlData.originalFileName,
            s3Url: urlData.s3Url,
            s3Key: urlData.s3Key,
            contentType: file.type,
            fileSize: file.size,
            category: urlData.category,
            chapterIndex: urlData.chapterIndex,
            lessonIndex: urlData.lessonIndex,
          });
        } catch (uploadErr) {
          console.error(`Failed to upload ${file.name}:`, uploadErr.message);
          uploadResults.push({
            success: false,
            fileName: file.name,
            error: uploadErr.message,
          });
        }
      }

      // Check for upload failures
      const failedUploads = uploadResults.filter(r => !r.success);
      if (failedUploads.length > 0) {
        throw new Error(`${failedUploads.length}/${files.length} files failed to upload`);
      }

      // Step 3: Validate all uploads
      const s3Urls = uploadResults.map(r => r.s3Url);
      await validateUploads(s3Urls);

      console.log('✅ All uploads complete and validated!');
      return uploadResults;
    } catch (err) {
      console.error('❌ Upload process failed:', err.message);
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadToS3,
    getPresignedUrls,
    uploadFileToS3,
    validateUploads,
    uploading,
    uploadProgress,
    error,
    setError,
  };
};
