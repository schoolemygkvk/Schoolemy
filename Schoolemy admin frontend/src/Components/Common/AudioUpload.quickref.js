/**
 * AUDIO UPLOAD - QUICK REFERENCE
 * ================================
 * 
 * This file contains quick copy-paste snippets for common use cases
 */

// ============================================
// 1. BASIC IMPORT
// ============================================
import AudioUpload from './Components/Common/AudioUpload';

// ============================================
// 2. MINIMAL SETUP
// ============================================
function MyPage() {
  return <AudioUpload />;
}

// ============================================
// 3. WITH CALLBACKS
// ============================================
function MyPage() {
  const handleComplete = (files) => {
    console.log('Uploaded:', files);
    // files = [{ url, key, name, size, type }]
  };

  const handleError = (errors) => {
    console.error('Errors:', errors);
    // errors = ["file1.mp3: error message", ...]
  };

  return (
    <AudioUpload
      onUploadComplete={handleComplete}
      onUploadError={handleError}
    />
  );
}

// ============================================
// 4. SAVE TO BACKEND DATABASE
// ============================================
import api from './Utils/api';

function MyPage() {
  const handleComplete = async (files) => {
    try {
      await api.post('/audio/save', {
        files: files.map(f => ({
          name: f.name,
          url: f.url,
          size: f.size,
          key: f.key
        }))
      });
      alert('Saved to database!');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return <AudioUpload onUploadComplete={handleComplete} />;
}

// ============================================
// 5. CUSTOM FOLDER & FILE SIZE
// ============================================
function PodcastUpload() {
  return (
    <AudioUpload
      folder="podcasts"
      maxFileSizeMB={200}
    />
  );
}

// ============================================
// 6. SINGLE FILE UPLOAD
// ============================================
function SingleAudioUpload() {
  return (
    <AudioUpload
      multiple={false}
      maxFileSizeMB={100}
    />
  );
}

// ============================================
// 7. WITH STATE MANAGEMENT
// ============================================
import { useState } from 'react';

function AudioManager() {
  const [audioFiles, setAudioFiles] = useState([]);

  const handleComplete = (files) => {
    setAudioFiles(prev => [...prev, ...files]);
  };

  return (
    <div>
      <AudioUpload onUploadComplete={handleComplete} />
      
      <h2>Uploaded Files: {audioFiles.length}</h2>
      <ul>
        {audioFiles.map((file, i) => (
          <li key={i}>
            {file.name}
            <audio controls src={file.url} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// 8. WITH LOADING STATE
// ============================================
function MyPage() {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div>
      {isUploading && <div>Processing uploads...</div>}
      <AudioUpload
        onUploadComplete={() => setIsUploading(false)}
        onUploadError={() => setIsUploading(false)}
      />
    </div>
  );
}

// ============================================
// 9. WITH TOAST NOTIFICATIONS
// ============================================
import { toast } from 'react-toastify';

function MyPage() {
  const handleComplete = (files) => {
    toast.success(`✅ Uploaded ${files.length} file(s)!`);
  };

  const handleError = (errors) => {
    toast.error(`❌ ${errors.length} file(s) failed`);
  };

  return (
    <AudioUpload
      onUploadComplete={handleComplete}
      onUploadError={handleError}
    />
  );
}

// ============================================
// 10. ORGANIZE BY USER
// ============================================
function UserAudioUpload({ userId }) {
  return (
    <AudioUpload
      folder={`audio/users/${userId}`}
    />
  );
}

// ============================================
// 11. ORGANIZE BY DATE
// ============================================
function DateOrganizedUpload() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  return (
    <AudioUpload
      folder={`audio/${today}`}
    />
  );
}

// ============================================
// 12. BACKEND ENDPOINT EXAMPLE (Node.js)
// ============================================
/*
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// POST /s3/presigned-url
app.post('/s3/presigned-url', async (req, res) => {
  const { filename, contentType, folder } = req.body;
  
  // Generate unique key
  const key = `${folder}/${Date.now()}-${filename}`;
  
  // Generate presigned URL (valid for 5 minutes)
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    Expires: 300
  };
  
  try {
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    const fileUrl = `https://${params.Bucket}.s3.amazonaws.com/${key}`;
    
    res.json({
      uploadUrl,
      fileUrl,
      key
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/

// ============================================
// 13. S3 BUCKET CORS CONFIGURATION
// ============================================
/*
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
*/

// ============================================
// 14. IAM POLICY FOR S3 UPLOADS
// ============================================
/*
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
*/

// ============================================
// 15. EXPECTED BACKEND RESPONSE
// ============================================
/*
{
  "uploadUrl": "https://bucket.s3.amazonaws.com/audio/123-file.mp3?X-Amz-Algorithm=AWS4-HMAC-SHA256...",
  "fileUrl": "https://bucket.s3.amazonaws.com/audio/123-file.mp3",
  "key": "audio/123-file.mp3"
}
*/

// ============================================
// 16. ERROR HANDLING EXAMPLE
// ============================================
function MyPage() {
  const handleError = (errors) => {
    // Log to monitoring service
    errors.forEach(error => {
      console.error('[Audio Upload Error]', error);
      
      // Send to Sentry, LogRocket, etc.
      if (window.Sentry) {
        Sentry.captureMessage(error, 'error');
      }
    });
    
    // Show user-friendly message
    alert('Some files failed to upload. Please try again.');
  };

  return <AudioUpload onUploadError={handleError} />;
}

// ============================================
// 17. VALIDATION RULES
// ============================================
/*
File Type: Must be audio/mpeg or end with .mp3
File Size: Must be <= maxFileSizeMB (default 500MB)
File Name: Any valid filename

Validation happens before upload to prevent wasted bandwidth
*/

// ============================================
// 18. UPLOAD PROCESS FLOW
// ============================================
/*
1. User selects file(s)
2. Frontend validates file type and size
3. Frontend requests presigned URL: POST /s3/presigned-url
4. Backend generates presigned URL from S3
5. Backend returns: { uploadUrl, fileUrl, key }
6. Frontend uploads directly to S3: PUT {uploadUrl}
7. S3 stores file and returns success
8. Frontend shows success message
*/

// ============================================
// 19. COMPLETE INTEGRATION EXAMPLE
// ============================================
import React, { useState } from 'react';
import AudioUpload from './Components/Common/AudioUpload';
import api from './Utils/api';

function PodcastManager() {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUploadComplete = async (files) => {
    setLoading(true);
    
    try {
      // Save metadata to database
      const response = await api.post('/podcasts', {
        episodes: files.map(f => ({
          title: f.name.replace('.mp3', ''),
          audioUrl: f.url,
          fileSize: f.size,
          s3Key: f.key,
          uploadedAt: new Date().toISOString()
        }))
      });
      
      // Update local state
      setPodcasts(prev => [...prev, ...response.data]);
      
      // Show success
      alert(`✅ ${files.length} podcast(s) uploaded successfully!`);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Files uploaded but failed to save metadata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="podcast-manager">
      <h1>Podcast Manager</h1>
      
      <AudioUpload
        folder="podcasts"
        maxFileSizeMB={300}
        onUploadComplete={handleUploadComplete}
      />
      
      {loading && <div className="loading">Saving metadata...</div>}
      
      <div className="podcast-list">
        <h2>Your Podcasts ({podcasts.length})</h2>
        {podcasts.map((podcast, i) => (
          <div key={i} className="podcast-card">
            <h3>{podcast.title}</h3>
            <audio controls src={podcast.audioUrl} />
            <p>Size: {(podcast.fileSize / 1024 / 1024).toFixed(2)} MB</p>
            <small>Uploaded: {new Date(podcast.uploadedAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PodcastManager;

// ============================================
// 20. TROUBLESHOOTING
// ============================================
/*
Problem: Upload fails immediately
Solution: Check backend endpoint /s3/presigned-url is accessible

Problem: Upload fails at 100%
Solution: Check S3 bucket CORS policy allows PUT requests

Problem: Files don't appear in S3
Solution: Check IAM permissions and bucket name in backend

Problem: Progress not showing
Solution: Verify XMLHttpRequest is being used (check s3Upload.js)

Problem: "Failed to get presigned URL"
Solution: Check backend logs, verify AWS credentials are configured

Problem: CORS error
Solution: Add your domain to S3 CORS policy and backend CORS config
*/
