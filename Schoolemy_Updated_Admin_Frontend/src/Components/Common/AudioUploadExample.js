import React from 'react';
import AudioUpload from './AudioUpload';


const AudioUploadExample = () => {
  

  const handleUploadComplete = (uploadedFiles) => {
    console.log('Upload complete! Files:', uploadedFiles);
  };


  const handleUploadError = (errors) => {
    console.error('Upload failed:', errors);
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
