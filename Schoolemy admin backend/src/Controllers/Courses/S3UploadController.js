import { PutObjectCommand, HeadObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../../DB/adudios3.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

/**
 * Generate presigned URLs for direct S3 uploads
 * This bypasses the API Gateway payload limit
 * Supports files up to 5GB with extended expiration time
 */
export const generatePresignedUrls = async (req, res) => {
  try {
    const { files } = req.body; // Array of { fileName, fileType, folder, fileSize }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Please provide files array with fileName, fileType, and folder" 
      });
    }

    console.log(`📦 Generating presigned URLs for ${files.length} file(s)`);

    // Validate file size limits (5GB per file for single upload)
    const MAX_SINGLE_UPLOAD_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    for (const file of files) {
      if (file.fileSize && file.fileSize > MAX_SINGLE_UPLOAD_SIZE) {
        return res.status(400).json({
          success: false,
          error: `File ${file.fileName} is too large (${(file.fileSize / 1024 / 1024 / 1024).toFixed(2)}GB). Use multipart upload for files > 5GB.`,
          useMultipart: true
        });
      }
    }

    const presignedUrls = await Promise.all(
      files.map(async (fileInfo) => {
        const { fileName, fileType, folder, customName } = fileInfo;

        if (!fileName || !fileType || !folder) {
          throw new Error("Each file must have fileName, fileType, and folder");
        }

        // Fix UTF-8 encoding for custom names
        const decodeUtf8Text = (text) => {
          try {
            const bytes = Buffer.from(text, 'latin1');
            const utf8Text = bytes.toString('utf8');
            
            if (/[\u0080-\u00FF]{2,}/.test(utf8Text)) {
              return utf8Text;
            }
            return text;
          } catch (e) {
            return text;
          }
        };

        // Use custom name if provided, otherwise use original filename
        let baseName;
        if (customName && typeof customName === "string" && customName.trim()) {
          const correctedName = decodeUtf8Text(customName.trim());
          baseName = path.basename(correctedName, path.extname(correctedName));
        } else {
          const correctedName = decodeUtf8Text(fileName);
          baseName = path.basename(correctedName, path.extname(fileName));
        }

        const ext = path.extname(fileName);
        const finalFileName = `${baseName}${ext}`;
        const key = `${folder}/${finalFileName}`;

        // Create the put command
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
          Key: key,
          ContentType: fileType,
          ContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(finalFileName)}`,
        });

        // Generate presigned URL (valid for 2 hours for large file uploads)
        // Extended time allows for slow network connections
        const expirationTime = fileInfo.fileSize > 100 * 1024 * 1024 ? 7200 : 3600; // 2 hours for >100MB, 1 hour otherwise
        const presignedUrl = await getSignedUrl(s3, command, { 
          expiresIn: expirationTime
        });

        console.log(`✅ Generated presigned URL for: ${finalFileName} (expires in ${expirationTime/60} minutes)`);

        // Construct the final S3 URL
        const keyParts = key.split('/');
        const encodedKeyParts = keyParts.map(part => encodeURIComponent(part));
        const encodedKey = encodedKeyParts.join('/');
        const s3Url = `https://${process.env.AWS_S3_BUCKET_SCHOOLEMY}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodedKey}`;

        return {
          fileName: finalFileName,
          originalName: baseName,
          presignedUrl,
          s3Url,
          key,
        };
      })
    );

    console.log(`✅ Successfully generated ${presignedUrls.length} presigned URL(s)`);

    res.status(200).json({ 
      success: true,
      count: presignedUrls.length, 
      presignedUrls,
      message: "Presigned URLs generated successfully. Upload files directly to S3 using these URLs."
    });
  } catch (error) {
    console.error("❌ Error generating presigned URLs:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate presigned URLs", 
      details: error.message 
    });
  }
};

/**
 * Validate uploaded files on S3
 * Verifies files were successfully uploaded before updating course
 */
export const validateS3Uploads = async (req, res) => {
  try {
    const { s3Urls } = req.body;

    if (!s3Urls || !Array.isArray(s3Urls)) {
      return res.status(400).json({ 
        success: false,
        error: "Please provide s3Urls array" 
      });
    }

    console.log(`🔍 Validating ${s3Urls.length} S3 upload(s)`);

    const validationResults = await Promise.all(
      s3Urls.map(async (url) => {
        try {
          // Extract key from S3 URL
          const urlObj = new URL(url);
          const key = decodeURIComponent(urlObj.pathname.substring(1)); // Remove leading '/'

          // Check if file exists on S3
          const headCommand = new HeadObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
            Key: key,
          });

          const response = await s3.send(headCommand);
          
          console.log(`✅ Validated: ${key} (${(response.ContentLength / 1024 / 1024).toFixed(2)} MB)`);

          return {
            url,
            exists: true,
            size: response.ContentLength,
            contentType: response.ContentType,
            lastModified: response.LastModified,
          };
        } catch (error) {
          console.error(`❌ Validation failed for: ${url}`, error.message);
          return {
            url,
            exists: false,
            error: error.message,
          };
        }
      })
    );

    const allValid = validationResults.every((result) => result.exists);
    const failedUploads = validationResults.filter((result) => !result.exists);

    if (!allValid) {
      return res.status(400).json({
        success: false,
        message: "Some files failed validation",
        validationResults,
        failedUploads,
      });
    }

    console.log(`✅ All ${s3Urls.length} file(s) validated successfully`);

    res.status(200).json({ 
      success: true, 
      message: "All files validated successfully",
      validationResults,
    });
  } catch (error) {
    console.error("❌ Error validating S3 uploads:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to validate S3 uploads", 
      details: error.message 
    });
  }
};

/**
 * Initialize multipart upload for very large files (> 5GB)
 * Returns upload ID and presigned URLs for each part
 */
export const initializeMultipartUpload = async (req, res) => {
  try {
    const { fileName, fileType, folder, fileSize, partCount } = req.body;

    if (!fileName || !fileType || !folder || !fileSize || !partCount) {
      return res.status(400).json({
        success: false,
        error: "Please provide fileName, fileType, folder, fileSize, and partCount"
      });
    }

    console.log(`🚀 Initializing multipart upload for: ${fileName} (${(fileSize / 1024 / 1024 / 1024).toFixed(2)} GB, ${partCount} parts)`);

    // Fix UTF-8 encoding
    const decodeUtf8Text = (text) => {
      try {
        const bytes = Buffer.from(text, 'latin1');
        const utf8Text = bytes.toString('utf8');
        if (/[\u0080-\u00FF]{2,}/.test(utf8Text)) {
          return utf8Text;
        }
        return text;
      } catch (e) {
        return text;
      }
    };

    const correctedName = decodeUtf8Text(fileName);
    const baseName = path.basename(correctedName, path.extname(fileName));
    const ext = path.extname(fileName);
    const finalFileName = `${baseName}${ext}`;
    const key = `${folder}/${finalFileName}`;

    // Create multipart upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
      Key: key,
      ContentType: fileType,
      ContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(finalFileName)}`,
    });

    const { UploadId } = await s3.send(createCommand);

    // Generate presigned URLs for each part (valid for 6 hours)
    const partUrls = [];
    for (let partNumber = 1; partNumber <= partCount; partNumber++) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
        Key: key,
        PartNumber: partNumber,
        UploadId,
      });

      const presignedUrl = await getSignedUrl(s3, uploadPartCommand, {
        expiresIn: 21600, // 6 hours for very large files
      });

      partUrls.push({
        partNumber,
        presignedUrl,
      });
    }

    // Construct final S3 URL
    const keyParts = key.split('/');
    const encodedKeyParts = keyParts.map(part => encodeURIComponent(part));
    const encodedKey = encodedKeyParts.join('/');
    const s3Url = `https://${process.env.AWS_S3_BUCKET_SCHOOLEMY}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodedKey}`;

    console.log(`✅ Multipart upload initialized: ${UploadId}`);

    res.status(200).json({
      success: true,
      uploadId: UploadId,
      key,
      fileName: finalFileName,
      partUrls,
      s3Url,
      message: "Upload each part using the provided URLs, then call complete-multipart-upload"
    });
  } catch (error) {
    console.error("❌ Error initializing multipart upload:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize multipart upload",
      details: error.message
    });
  }
};

/**
 * Complete multipart upload after all parts are uploaded
 */
export const completeMultipartUpload = async (req, res) => {
  try {
    const { uploadId, key, parts } = req.body;

    if (!uploadId || !key || !parts || !Array.isArray(parts)) {
      return res.status(400).json({
        success: false,
        error: "Please provide uploadId, key, and parts array"
      });
    }

    console.log(`🏁 Completing multipart upload: ${uploadId} (${parts.length} parts)`);

    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map(part => ({
          ETag: part.etag,
          PartNumber: part.partNumber
        }))
      }
    });

    const result = await s3.send(completeCommand);

    // Construct final S3 URL
    const keyParts = key.split('/');
    const encodedKeyParts = keyParts.map(part => encodeURIComponent(part));
    const encodedKey = encodedKeyParts.join('/');
    const s3Url = `https://${process.env.AWS_S3_BUCKET_SCHOOLEMY}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodedKey}`;

    console.log(`✅ Multipart upload completed: ${key}`);

    res.status(200).json({
      success: true,
      s3Url,
      key,
      etag: result.ETag,
      message: "File uploaded successfully"
    });
  } catch (error) {
    console.error("❌ Error completing multipart upload:", error);
    res.status(500).json({
      success: false,
      error: "Failed to complete multipart upload",
      details: error.message
    });
  }
};

/**
 * Abort multipart upload if something goes wrong
 */
export const abortMultipartUpload = async (req, res) => {
  try {
    const { uploadId, key } = req.body;

    if (!uploadId || !key) {
      return res.status(400).json({
        success: false,
        error: "Please provide uploadId and key"
      });
    }

    console.log(`🛑 Aborting multipart upload: ${uploadId}`);

    const abortCommand = new AbortMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
      Key: key,
      UploadId: uploadId
    });

    await s3.send(abortCommand);

    console.log(`✅ Multipart upload aborted: ${uploadId}`);

    res.status(200).json({
      success: true,
      message: "Multipart upload aborted successfully"
    });
  } catch (error) {
    console.error("❌ Error aborting multipart upload:", error);
    res.status(500).json({
      success: false,
      error: "Failed to abort multipart upload",
      details: error.message
    });
  }
};
