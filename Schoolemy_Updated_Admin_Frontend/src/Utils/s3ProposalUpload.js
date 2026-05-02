import axios from './api';


export const getProposalPresignedUrl = async (fileName, fileType) => {
  try {
    const response = await axios.post('/presigned-proposal-url', {
      fileName,
      fileType,
      expiresIn: 3600,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    throw error;
  }
};


export const uploadToS3 = async (presignedUrl, file, fileType) => {
  try {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': fileType,
      },
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};


export const getProposalDownloadUrl = async (s3Key) => {
  try {
    const response = await axios.post('/presigned-proposal-download', {
      s3Key,
      expiresIn: 3600,
    });
    return response.data.data.downloadUrl;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};


export const deleteProposalFile = async (s3Key) => {
  try {
    const response = await axios.delete('/proposal-file', {
      data: { s3Key },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting proposal file:', error);
    throw error;
  }
};
