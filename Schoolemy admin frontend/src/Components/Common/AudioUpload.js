import React, { useState } from 'react';
import { getPresignedUrl, uploadToS3 } from '../../Utils/s3Upload';
import './AudioUpload.css';

/**
 * AudioUpload Component
 * 
 * A robust React component for uploading audio files (mp3) to AWS S3 using pre-signed URLs
 * 
 * Features:
 * - Multiple audio file support
 * - File size validation (max 500MB per file)
 * - Real-time upload progress tracking
 * - Error handling and user feedback
 * - Uses fetch API (via XMLHttpRequest for progress) for S3 PUT upload
 * - Sets correct Content-Type: audio/mpeg
 * - Production-ready with best practices
 * 
 * Props:
 * @param {string} folder - S3 folder path (default: 'audio')
 * @param {function} onUploadComplete - Callback when all uploads complete, receives array of uploaded file data
 * @param {function} onUploadError - Callback when upload fails
 * @param {number} maxFileSizeMB - Maximum file size in MB (default: 500)
 * @param {boolean} multiple - Allow multiple file selection (default: true)
 * 
 * @returns {JSX.Element} Audio upload component
 */
const AudioUpload = ({ 
  folder = 'audio', 
  onUploadComplete, 
  onUploadError,
  maxFileSizeMB = 500,
  multiple = true 
}) => {
  // State management
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  /**
   * Validate file before upload
   * Checks:
   * - File type is audio/mpeg (mp3)
   * - File size is within limit
   */
  const validateFile = (file) => {
    const errors = [];
    
    // Check file type
    if (file.type !== 'audio/mpeg' && !file.name.toLowerCase().endsWith('.mp3')) {
      errors.push(`${file.name}: Invalid file type. Only MP3 files are allowed.`);
    }
    
    // Check file size (convert to MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      errors.push(
        `${file.name}: File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum limit of ${maxFileSizeMB}MB.`
      );
    }
    
    return errors;
  };

  /**
   * Handle file selection
   * Validates files and updates state
   */
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) {
      return;
    }

    // Validate all files
    const allErrors = [];
    const validFiles = [];

    files.forEach(file => {
      const errors = validateFile(file);
      if (errors.length > 0) {
        allErrors.push(...errors);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors if any
    if (allErrors.length > 0) {
      alert('File Validation Errors:\n\n' + allErrors.join('\n'));
    }

    // Set only valid files
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      
      // Initialize progress and status for each file
      const initialProgress = {};
      const initialStatus = {};
      validFiles.forEach((file, index) => {
        initialProgress[index] = 0;
        initialStatus[index] = 'pending';
      });
      setUploadProgress(initialProgress);
      setUploadStatus(initialStatus);
      setUploadedFiles([]);
    }
  };

  /**
   * Upload a single audio file to S3
   * 
   * Steps:
   * 1. Request pre-signed URL from backend
   * 2. Upload file directly to S3 using PUT request
   * 3. Track progress and handle errors
   */
  const uploadSingleFile = async (file, index) => {
    console.log(`[AudioUpload] Starting upload for: ${file.name}`);
    
    try {
      // Update status to uploading
      setUploadStatus(prev => ({ ...prev, [index]: 'uploading' }));
      
      // Step 1: Request pre-signed URL from backend
      // Backend endpoint: POST /s3/presigned-url
      // Request body: { filename, contentType, folder }
      console.log(`[AudioUpload] Requesting pre-signed URL for: ${file.name}`);
      
      const presignedData = await getPresignedUrl(
        file.name,
        'audio/mpeg', // Always use audio/mpeg for mp3 files
        folder
      );

      if (!presignedData || !presignedData.uploadUrl) {
        throw new Error('Failed to get pre-signed URL from backend');
      }

      const { uploadUrl, fileUrl, key } = presignedData;
      console.log(`[AudioUpload] Received pre-signed URL for: ${file.name}`);

      // Step 2: Upload directly to S3 using PUT request
      // The uploadToS3 function uses XMLHttpRequest for progress tracking
      // Content-Type header is set to audio/mpeg
      await uploadToS3(
        file,
        uploadUrl,
        (percent) => {
          // Update progress callback
          setUploadProgress(prev => ({ ...prev, [index]: percent }));
        }
      );

      // Step 3: Upload successful
      console.log(`[AudioUpload] ✅ Successfully uploaded: ${file.name}`);
      
      setUploadStatus(prev => ({ ...prev, [index]: 'success' }));
      setUploadProgress(prev => ({ ...prev, [index]: 100 }));

      // Return uploaded file data
      return {
        url: fileUrl,
        key: key,
        name: file.name,
        size: file.size,
        type: file.type,
        duration: null, // Could be calculated if needed
      };

    } catch (error) {
      // Step 4: Handle errors
      console.error(`[AudioUpload] ❌ Upload failed for ${file.name}:`, error);
      
      setUploadStatus(prev => ({ ...prev, [index]: 'error' }));
      setUploadProgress(prev => ({ ...prev, [index]: 0 }));

      // Determine error type for better user feedback
      let errorMessage = error.message || 'Unknown error';
      
      if (error.message.includes('presigned URL')) {
        errorMessage = 'Failed to get upload permission from server';
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network connection lost during upload';
      } else if (error.message.includes('S3 upload failed')) {
        errorMessage = 'Failed to upload to storage server';
      }

      throw new Error(`${file.name}: ${errorMessage}`);
    }
  };

  /**
   * Handle upload submission
   * Uploads all selected files sequentially with error handling
   */
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select audio files to upload');
      return;
    }

    setIsUploading(true);
    const uploadResults = [];
    const uploadErrors = [];

    console.log(`[AudioUpload] === Starting upload of ${selectedFiles.length} file(s) ===`);

    // Upload files sequentially to avoid overwhelming the browser/network
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      try {
        const result = await uploadSingleFile(file, i);
        uploadResults.push(result);
        console.log(`[AudioUpload] Progress: ${i + 1}/${selectedFiles.length} files uploaded`);
      } catch (error) {
        uploadErrors.push(error.message);
        console.error(`[AudioUpload] Error uploading file ${i + 1}:`, error);
      }
    }

    setIsUploading(false);

    // Handle results
    if (uploadResults.length > 0) {
      setUploadedFiles(uploadResults);
      console.log(`[AudioUpload] ✅ Upload complete: ${uploadResults.length} file(s) uploaded successfully`);
      
      if (onUploadComplete) {
        onUploadComplete(uploadResults);
      }
    }

    if (uploadErrors.length > 0) {
      const errorMessage = 'Upload Errors:\n\n' + uploadErrors.join('\n');
      console.error(`[AudioUpload] ❌ Upload errors:`, uploadErrors);
      alert(errorMessage);
      
      if (onUploadError) {
        onUploadError(uploadErrors);
      }
    }

    // Show success message
    if (uploadResults.length > 0 && uploadErrors.length === 0) {
      alert(`Successfully uploaded ${uploadResults.length} audio file(s)!`);
    } else if (uploadResults.length > 0 && uploadErrors.length > 0) {
      alert(
        `Partially completed:\n` +
        `✅ ${uploadResults.length} file(s) uploaded\n` +
        `❌ ${uploadErrors.length} file(s) failed`
      );
    }
  };

  /**
   * Clear selected files and reset state
   */
  const handleClear = () => {
    setSelectedFiles([]);
    setUploadProgress({});
    setUploadStatus({});
    setUploadedFiles([]);
    document.getElementById('audio-file-input').value = '';
  };

  /**
   * Get status icon based on upload status
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'uploading':
        return '📤';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '';
    }
  };

  return (
    <div className="audio-upload-container">
      <div className="audio-upload-header">
        <h2>Audio Upload</h2>
        <p className="audio-upload-description">
          Upload audio files (MP3 format only, max {maxFileSizeMB}MB per file)
        </p>
      </div>

      {/* File Input */}
      <div className="audio-upload-input-section">
        <label htmlFor="audio-file-input" className="audio-file-label">
          Choose Audio Files
        </label>
        <input
          id="audio-file-input"
          type="file"
          accept="audio/mpeg,.mp3"
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="audio-file-input"
        />
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="audio-upload-files-list">
          <h3>Selected Files ({selectedFiles.length})</h3>
          <ul className="audio-files-list">
            {selectedFiles.map((file, index) => (
              <li key={index} className={`audio-file-item status-${uploadStatus[index]}`}>
                <div className="audio-file-info">
                  <span className="audio-status-icon">{getStatusIcon(uploadStatus[index])}</span>
                  <span className="audio-file-name">{file.name}</span>
                  <span className="audio-file-size">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                
                {/* Progress Bar */}
                {uploadStatus[index] === 'uploading' && (
                  <div className="audio-progress-container">
                    <div className="audio-progress-bar">
                      <div 
                        className="audio-progress-fill"
                        style={{ width: `${uploadProgress[index]}%` }}
                      />
                    </div>
                    <span className="audio-progress-text">{uploadProgress[index]}%</span>
                  </div>
                )}

                {/* Status Message */}
                {uploadStatus[index] === 'success' && (
                  <span className="audio-status-message success">Upload complete</span>
                )}
                {uploadStatus[index] === 'error' && (
                  <span className="audio-status-message error">Upload failed</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="audio-upload-actions">
        <button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className="audio-btn audio-btn-primary"
        >
          {isUploading ? 'Uploading...' : 'Upload Audio Files'}
        </button>
        
        <button
          onClick={handleClear}
          disabled={isUploading}
          className="audio-btn audio-btn-secondary"
        >
          Clear Selection
        </button>
      </div>

      {/* Upload Summary */}
      {uploadedFiles.length > 0 && (
        <div className="audio-upload-summary">
          <h3>✅ Upload Summary</h3>
          <p>{uploadedFiles.length} file(s) uploaded successfully</p>
          <ul className="audio-uploaded-list">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="audio-uploaded-item">
                <strong>{file.name}</strong>
                <br />
                <small className="audio-uploaded-url">URL: {file.url}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Help Text */}
      <div className="audio-upload-help">
        <h4>📋 Upload Process:</h4>
        <ol>
          <li>Select one or more MP3 audio files</li>
          <li>Files are validated (format & size)</li>
          <li>Click "Upload Audio Files"</li>
          <li>Backend provides secure pre-signed URLs</li>
          <li>Files upload directly to AWS S3</li>
          <li>Progress is tracked in real-time</li>
          <li>Success/error feedback is displayed</li>
        </ol>
      </div>
    </div>
  );
};

export default AudioUpload;
