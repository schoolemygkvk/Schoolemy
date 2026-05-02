/**
 * Media URL utility — returns CDN URL if CLOUDFRONT_MEDIA_URL is set, else raw S3 URL
 * This allows operators to activate CloudFront without any code changes
 */

const CDN_BASE = process.env.CLOUDFRONT_MEDIA_URL?.replace(/\/$/, '');

/**
 * Convert S3 URL to CDN URL if CLOUDFRONT_MEDIA_URL env var is set
 * @param {string} s3Url - Direct S3 URL (e.g., https://bucket.s3.region.amazonaws.com/key)
 * @returns {string} - CDN URL if CDN_BASE is set, else original S3 URL
 */
export function getMediaUrl(s3Url) {
  if (!CDN_BASE || !s3Url) {
    return s3Url;
  }

  // Replace https://bucket.s3.region.amazonaws.com with CDN base
  return s3Url.replace(/https:\/\/[^/]+\.amazonaws\.com/, CDN_BASE);
}
