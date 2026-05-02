

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";
import {
  processImage,
  generateS3Keys,
  generateSrcSet,
  generateSizesAttribute,
  isValidImageType,
  getOptimalFormat,
  IMAGE_SIZES,
} from "../../Utils/imageProcessor.js";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "course-audio-bucket-schoolemy";


export const generateResponsiveUploadUrls = async (req, res) => {
  try {
    const {
      fileName,
      fileType,
      folder = "images",
      sizes = ["thumbnail", "small", "medium", "large"],
      outputFormat = "webp",
      expiresIn = 3600,
    } = req.body;

    // Validation
    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        error: "fileName and fileType are required",
      });
    }

    if (!isValidImageType(fileType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid image type. Supported: jpeg, png, webp, gif, avif",
      });
    }

    // Generate S3 keys for all sizes
    const s3Keys = generateS3Keys(folder, fileName, sizes, outputFormat);

    // Generate presigned URLs for each size
    const uploadUrls = {};
    const s3Urls = {};

    for (const [sizeName, s3Key] of Object.entries(s3Keys)) {
      const contentType = sizeName === "original" ? fileType : `image/${outputFormat}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        ContentType: contentType,
        Metadata: {
          "original-filename": fileName,
          "size-variant": sizeName,
          "uploaded-by": req.user?.id || "anonymous",
          "upload-timestamp": new Date().toISOString(),
        },
        ServerSideEncryption: "AES256",
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: Math.min(expiresIn, 3600),
      });

      uploadUrls[sizeName] = presignedUrl;
      s3Urls[sizeName] = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${s3Key}`;
    }

    // Generate srcSet and sizes for frontend
    const srcSet = generateSrcSet(s3Urls);
    const sizesAttr = generateSizesAttribute();

    res.status(200).json({
      success: true,
      message: "Responsive upload URLs generated successfully",
      data: {
        uploadUrls,
        s3Keys,
        s3Urls,
        srcSet,
        sizesAttribute: sizesAttr,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        sizeConfigs: Object.fromEntries(
          sizes.map((size) => [size, IMAGE_SIZES[size]])
        ),
      },
    });
  } catch (error) {
    console.error("Error generating responsive upload URLs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate responsive upload URLs",
      message: error.message,
    });
  }
};


export const processAndUploadResponsive = async (req, res) => {
  try {
    const { imageBuffer, fileName, folder = "images", outputFormat } = req.body;

    if (!imageBuffer || !fileName) {
      return res.status(400).json({
        success: false,
        error: "imageBuffer and fileName are required",
      });
    }

    // Determine optimal format based on browser support
    const format = outputFormat || getOptimalFormat(req.headers.accept);

    // Process image into multiple sizes
    const { results, originalMetadata } = await processImage(
      Buffer.from(imageBuffer, "base64"),
      {
        sizes: ["thumbnail", "small", "medium", "large"],
        outputFormat: format,
        includeOriginal: true,
      }
    );

    // Generate S3 keys
    const s3Keys = generateS3Keys(folder, fileName, Object.keys(results), format);

    // Upload each size to S3
    const uploadedUrls = {};
    for (const [sizeName, imageData] of Object.entries(results)) {
      const s3Key = s3Keys[sizeName];
      const contentType = sizeName === "original" 
        ? `image/${originalMetadata.format}` 
        : `image/${format}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: imageData.buffer,
        ContentType: contentType,
        Metadata: {
          "original-filename": fileName,
          "size-variant": sizeName,
          width: String(imageData.width),
          height: String(imageData.height),
          "file-size": String(imageData.size),
        },
        ServerSideEncryption: "AES256",
      });

      await s3Client.send(command);
      uploadedUrls[sizeName] = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${s3Key}`;
    }

    // Generate srcSet for frontend
    const srcSet = generateSrcSet(uploadedUrls);
    const sizesAttr = generateSizesAttribute();

    res.status(200).json({
      success: true,
      message: "Responsive images processed and uploaded successfully",
      data: {
        urls: uploadedUrls,
        s3Keys,
        srcSet,
        sizesAttribute: sizesAttr,
        originalMetadata: {
          width: originalMetadata.width,
          height: originalMetadata.height,
          format: originalMetadata.format,
        },
        processedSizes: Object.fromEntries(
          Object.entries(results).map(([size, data]) => [
            size,
            { width: data.width, height: data.height, size: data.size },
          ])
        ),
      },
    });
  } catch (error) {
    console.error("Error processing responsive images:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process responsive images",
      message: error.message,
    });
  }
};


export const getResponsiveImageInfo = async (req, res) => {
  try {
    const { s3Key } = req.params;

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        error: "s3Key is required",
      });
    }

    // Parse the s3Key to find related size variants
    const keyParts = s3Key.split("/");
    const fileName = keyParts.pop();
    const folder = keyParts.join("/");

    // Extract base name (remove size suffix and extension)
    const sizePattern = /_(thumbnail|small|medium|large|original)_\d+_[a-f0-9]+\.[a-z]+$/;
    const baseName = fileName.replace(sizePattern, "");

    // Find all related images
    const sizes = ["thumbnail", "small", "medium", "large", "original"];
    const urls = {};

    for (const size of sizes) {
      // Construct potential URL (this is a simplified version)
      const potentialKey = s3Key.replace(sizePattern, `_${size}_`);
      urls[size] = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${potentialKey}`;
    }

    const srcSet = generateSrcSet(urls);
    const sizesAttr = generateSizesAttribute();

    res.status(200).json({
      success: true,
      data: {
        urls,
        srcSet,
        sizesAttribute: sizesAttr,
      },
    });
  } catch (error) {
    console.error("Error getting responsive image info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get responsive image info",
      message: error.message,
    });
  }
};

export default {
  generateResponsiveUploadUrls,
  processAndUploadResponsive,
  getResponsiveImageInfo,
};
