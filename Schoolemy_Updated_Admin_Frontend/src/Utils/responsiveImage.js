

import api from "./api";

// Image size configurations (must match backend)
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 400, height: null },
  medium: { width: 800, height: null },
  large: { width: 1200, height: null },
  original: { width: null, height: null },
};

export const getResponsiveUploadUrls = async (fileName, fileType, options = {}) => {
  const { folder = "images", sizes, outputFormat = "webp" } = options;

  const response = await api.post("/s3/responsive-upload", {
    fileName,
    fileType,
    folder,
    sizes,
    outputFormat,
  });

  return response.data.data;
};


export const uploadResponsiveImage = async (file, uploadUrls, onProgress = null) => {
  const results = {};
  const totalSizes = Object.keys(uploadUrls).length;
  let completedSizes = 0;

  // For client-side resizing, we need to process the image
  const imageBuffer = await fileToBuffer(file);

  for (const [sizeName, uploadUrl] of Object.entries(uploadUrls)) {
    try {
      let uploadBuffer;

      if (sizeName === "original") {
        uploadBuffer = imageBuffer;
      } else {
        // Resize image on client side
        uploadBuffer = await resizeImage(imageBuffer, IMAGE_SIZES[sizeName]);
      }

      // Upload to S3
      await uploadToS3(uploadUrl, uploadBuffer, file.type);

      results[sizeName] = { success: true };
      completedSizes++;

      if (onProgress) {
        onProgress({
          completed: completedSizes,
          total: totalSizes,
          percentage: Math.round((completedSizes / totalSizes) * 100),
          currentSize: sizeName,
        });
      }
    } catch (error) {
      results[sizeName] = { success: false, error: error.message };
    }
  }

  return results;
};


const fileToBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};


const resizeImage = async (buffer, sizeConfig) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = sizeConfig;
      const aspectRatio = img.width / img.height;

      // Calculate dimensions maintaining aspect ratio
      if (width && !height) {
        height = Math.round(width / aspectRatio);
      } else if (height && !width) {
        width = Math.round(height * aspectRatio);
      } else if (width && height) {
        // Cover mode - crop to fit
        const targetRatio = width / height;
        if (aspectRatio > targetRatio) {
          width = Math.round(height * aspectRatio);
        } else {
          height = Math.round(width / aspectRatio);
        }
      } else {
        // Original size
        width = img.width;
        height = img.height;
      }

      // Don't upscale
      if (width > img.width) width = img.width;
      if (height > img.height) height = img.height;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          blob.arrayBuffer().then(resolve).catch(reject);
        },
        "image/webp",
        0.8
      );
    };

    img.onerror = reject;
    img.src = url;
  });
};


const uploadToS3 = async (presignedUrl, buffer, contentType) => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: buffer,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response;
};


export const getResponsiveImageProps = (urls, alt, options = {}) => {
  const {
    defaultSize = "medium",
    loading = "lazy",
    sizes = "(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw",
  } = options;

  // Build srcSet
  const widths = {
    thumbnail: "150w",
    small: "400w",
    medium: "800w",
    large: "1200w",
  };

  const srcSet = Object.entries(urls)
    .filter(([size]) => size !== "original" && widths[size])
    .map(([size, url]) => `${url} ${widths[size]}`)
    .join(", ");

  return {
    src: urls[defaultSize] || urls.medium || urls.original,
    srcSet,
    sizes,
    alt,
    loading,
  };
};


export const ResponsiveImage = (urls, alt, options = {}) => {
  return getResponsiveImageProps(urls, alt, options);
};


export const getOptimalImageUrl = (urls, viewportWidth = window.innerWidth) => {
  if (viewportWidth <= 480) return urls.small || urls.medium || urls.original;
  if (viewportWidth <= 768) return urls.medium || urls.large || urls.original;
  if (viewportWidth <= 1200) return urls.large || urls.original;
  return urls.original || urls.large;
};


export const preloadResponsiveImages = (urls, sizes = ["small", "medium"]) => {
  sizes.forEach((size) => {
    if (urls[size]) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = urls[size];
      document.head.appendChild(link);
    }
  });
};

export default {
  getResponsiveUploadUrls,
  uploadResponsiveImage,
  getResponsiveImageProps,
  ResponsiveImage,
  getOptimalImageUrl,
  preloadResponsiveImages,
  IMAGE_SIZES,
};
