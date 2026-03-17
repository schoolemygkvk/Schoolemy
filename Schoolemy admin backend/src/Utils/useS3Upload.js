/**
 * React Hook for S3 Direct Upload
 * Usage: const { uploadFile, uploading, progress, error } = useS3Upload();
 */

import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://w4jpp7oi02.execute-api.ap-south-1.amazonaws.com/dev';

export const useS3Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file, folder) => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      // Step 1: Get pre-signed URL
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/s3/generate-upload-url`,
        {
          fileName: file.name,
          fileType: file.type,
          folder: folder,
          fileSize: file.size,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { uploadUrl, fileUrl } = response.data.data;

      // Step 2: Upload to S3
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      setProgress(100);
      setUploading(false);
      return fileUrl;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Upload failed';
      setError(errorMessage);
      setUploading(false);
      throw new Error(errorMessage);
    }
  };

  return { uploadFile, uploading, progress, error };
};

// Example Usage:
// 
// function CourseForm() {
//   const { uploadFile, uploading, progress, error } = useS3Upload();
//   const [thumbnailUrl, setThumbnailUrl] = useState('');
//
//   const handleFileSelect = async (e) => {
//     const file = e.target.files[0];
//     try {
//       const url = await uploadFile(file, 'thumbnails');
//       setThumbnailUrl(url);
//       console.log('Uploaded:', url);
//     } catch (err) {
//       alert('Upload failed: ' + err.message);
//     }
//   };
//
//   return (
//     <div>
//       <input type="file" onChange={handleFileSelect} disabled={uploading} />
//       {uploading && <p>Uploading: {progress}%</p>}
//       {error && <p style={{color: 'red'}}>{error}</p>}
//       {thumbnailUrl && <img src={thumbnailUrl} alt="Uploaded" />}
//     </div>
//   );
// }
