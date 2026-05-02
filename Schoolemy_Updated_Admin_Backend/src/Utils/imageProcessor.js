/**
 * Image Processor Utility
 * 
 * Handles responsive image generation with multiple sizes
 * for optimized delivery across different devices.
 */

// import sharp from "sharp"; // TODO: Install as Lambda Layer
import path from "path";
import crypto from "crypto";

// Image size configurations
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, fit: "cover" },
  small: { width: 400, height: null, fit: "inside" },
  medium: { width: 800, height: null, fit: "inside" },
  large: { width: 1200, height: null, fit: "inside" },
  original: { width: null, height: null, fit: null },
};

// Supported image formats
export const SUPPORTED_FORMATS = ["jpeg", "jpg", "png", "webp", "gif", "avif"];

// Default quality settings
const QUALITY_SETTINGS = {
  webp: 80,
  jpeg: 85,
  png: 90,
  avif: 65,
};

/**
 * Process an image buffer and generate multiple sizes
 * 
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Object containing processed images
 */
export const processImage = async (imageBuffer, options = {}) => {
  const {
    sizes = ["thumbnail", "small", "medium", "large"],
    outputFormat = "webp",
    quality = QUALITY_SETTINGS[outputFormat] || 80,
    includeOriginal = true,
  } = options;

  const results = {};
  const metadata = await sharp(imageBuffer).metadata();

  for (const sizeName of sizes) {
    const sizeConfig = IMAGE_SIZES[sizeName];
    if (!sizeConfig) continue;

    try {
      let processor = sharp(imageBuffer);

      // Resize if dimensions specified
      if (sizeConfig.width || sizeConfig.height) {
        processor = processor.resize({
          width: sizeConfig.width,
          height: sizeConfig.height,
          fit: sizeConfig.fit || "inside",
          withoutEnlargement: true,
        });
      }

      // Convert to output format
      switch (outputFormat) {
        case "webp":
          processor = processor.webp({ quality });
          break;
        case "avif":
          processor = processor.avif({ quality });
          break;
        case "png":
          processor = processor.png({ quality });
          break;
        case "jpeg":
        case "jpg":
        default:
          processor = processor.jpeg({ quality });
          break;
      }

      const processedBuffer = await processor.toBuffer();
      const processedMetadata = await sharp(processedBuffer).metadata();

      results[sizeName] = {
        buffer: processedBuffer,
        width: processedMetadata.width,
        height: processedMetadata.height,
        size: processedBuffer.length,
        format: outputFormat,
      };
    } catch (error) {
      console.error(`Error processing ${sizeName} size:`, error.message);
    }
  }

  // Include original if requested
  if (includeOriginal) {
    results.original = {
      buffer: imageBuffer,
      width: metadata.width,
      height: metadata.height,
      size: imageBuffer.length,
      format: metadata.format,
    };
  }

  return {
    results,
    originalMetadata: metadata,
  };
};

/**
 * Generate unique filename with size suffix
 * 
 * @param {string} originalFileName - Original file name
 * @param {string} sizeName - Size identifier
 * @param {string} format - Output format
 * @returns {string} - Generated filename
 */
export const generateFileName = (originalFileName, sizeName, format = "webp") => {
  const baseName = path.basename(originalFileName, path.extname(originalFileName));
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
  const uniqueId = crypto.randomBytes(4).toString("hex");
  const timestamp = Date.now();
  
  return `${sanitizedBaseName}_${sizeName}_${timestamp}_${uniqueId}.${format}`;
};

/**
 * Generate S3 keys for all image sizes
 * 
 * @param {string} folder - S3 folder path
 * @param {string} originalFileName - Original file name
 * @param {Array} sizes - Array of size names
 * @param {string} format - Output format
 * @returns {Object} - Object mapping size names to S3 keys
 */
export const generateS3Keys = (folder, originalFileName, sizes, format = "webp") => {
  const keys = {};
  const baseName = path.basename(originalFileName, path.extname(originalFileName));
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const timestamp = Date.now();

  for (const sizeName of sizes) {
    keys[sizeName] = `${folder}/${sanitizedBaseName}_${sizeName}_${timestamp}_${uniqueId}.${format}`;
  }

  // Original keeps its format
  const originalExt = path.extname(originalFileName).slice(1) || "jpg";
  keys.original = `${folder}/${sanitizedBaseName}_original_${timestamp}_${uniqueId}.${originalExt}`;

  return keys;
};

/**
 * Get responsive image srcSet string for frontend
 * 
 * @param {Object} urls - Object mapping size names to URLs
 * @returns {string} - srcSet string for img tag
 */
export const generateSrcSet = (urls) => {
  const widths = {
    thumbnail: "150w",
    small: "400w",
    medium: "800w",
    large: "1200w",
  };

  return Object.entries(urls)
    .filter(([size]) => size !== "original" && widths[size])
    .map(([size, url]) => `${url} ${widths[size]}`)
    .join(", ");
};

/**
 * Get responsive image sizes attribute for frontend
 * 
 * @param {Object} options - Options for sizes attribute
 * @returns {string} - sizes attribute string
 */
export const generateSizesAttribute = (options = {}) => {
  const {
    mobile = "100vw",
    tablet = "50vw",
    desktop = "33vw",
  } = options;

  return `(max-width: 480px) ${mobile}, (max-width: 768px) ${tablet}, ${desktop}`;
};

/**
 * Validate if file is a supported image
 * 
 * @param {string} mimeType - File MIME type
 * @returns {boolean} - Whether file is supported
 */
export const isValidImageType = (mimeType) => {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ];
  return validTypes.includes(mimeType);
};

/**
 * Get optimal format based on browser support
 * 
 * @param {string} acceptHeader - Browser Accept header
 * @returns {string} - Optimal format
 */
export const getOptimalFormat = (acceptHeader = "") => {
  if (acceptHeader.includes("image/avif")) return "avif";
  if (acceptHeader.includes("image/webp")) return "webp";
  return "jpeg";
};

export default {
  processImage,
  generateFileName,
  generateS3Keys,
  generateSrcSet,
  generateSizesAttribute,
  isValidImageType,
  getOptimalFormat,
  IMAGE_SIZES,
  SUPPORTED_FORMATS,
};
