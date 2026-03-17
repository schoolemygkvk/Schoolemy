import React from 'react';
import AudioUpload from './AudioUpload';

/**
 * Example usage of the AudioUpload component
 * 
 * This demonstrates various ways to integrate the AudioUpload component
 * into your React application
 */
const AudioUploadExample = () => {
  
  /**
   * Callback when upload completes successfully
   * @param {Array} uploadedFiles - Array of uploaded file objects
   */
  const handleUploadComplete = (uploadedFiles) => {
    console.log('✅ Upload complete! Files:', uploadedFiles);
    
    // Example: Save file URLs to your backend database
    // uploadedFiles.forEach(file => {
    //   api.post('/save-audio', {
    //     name: file.name,
    //     url: file.url,
    //     size: file.size,
    //     key: file.key
    //   });
    // });
    
    // Example: Update parent component state
    // setAudioFiles(uploadedFiles);
  };

  /**
   * Callback when upload fails
   * @param {Array} errors - Array of error messages
   */
  const handleUploadError = (errors) => {
    console.error('❌ Upload failed:', errors);
    
    // Example: Send errors to error tracking service
    // errors.forEach(error => {
    //   errorTracker.logError('Audio Upload Failed', { error });
    // });
  };

  return (
    <div className="audio-upload-page">
      <h1>Audio Upload Demo</h1>
      
      {/* Basic Usage */}
      <section>
        <h2>Basic Usage</h2>
        <AudioUpload />
      </section>

      {/* With Callbacks */}
      <section>
        <h2>With Callbacks</h2>
        <AudioUpload
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </section>

      {/* Custom Configuration */}
      <section>
        <h2>Custom Configuration</h2>
        <AudioUpload
          folder="podcasts"  // Custom S3 folder
          maxFileSizeMB={200}  // Smaller file size limit
          multiple={true}  // Allow multiple files
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </section>

      {/* Single File Upload */}
      <section>
        <h2>Single File Upload</h2>
        <AudioUpload
          folder="single-audio"
          multiple={false}  // Only one file at a time
          maxFileSizeMB={100}
        />
      </section>
    </div>
  );
};

export default AudioUploadExample;
