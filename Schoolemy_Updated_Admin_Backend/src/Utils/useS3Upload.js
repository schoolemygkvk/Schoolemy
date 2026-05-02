/**
 * React Hook for S3 Direct Upload
 * Usage: const { uploadFile, uploading, progress, error } = useS3Upload();
 */

import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || process.env.API_URL || 'http://localhost:5000';

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
//       {thumbnailUrl && <img src={thumbnailUrl} alt="Uploaded" />}
//     </div>
//   );
// }
