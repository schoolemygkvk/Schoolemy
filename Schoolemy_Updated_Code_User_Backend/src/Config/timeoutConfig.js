

import logger from "../Utils/logger.js";


export const dbTimeouts = {
  // Time to select a MongoDB server (serverSelectionTimeoutMS)
  // Used when connecting to MongoDB Atlas or self-hosted MongoDB
  // Increase for unreliable networks or during maintenance
  serverSelection: parseInt(
    process.env.DB_SERVER_SELECTION_TIMEOUT || "30000",
  ),

  // Time for socket operations (socketTimeoutMS)
  // Used for ongoing socket operations after connection is established
  // Increase for slow queries or large data transfers
  socket: parseInt(
    process.env.DB_SOCKET_TIMEOUT || "45000",
  ),

  // Time to establish initial connection (connectTimeoutMS)
  // Used for the initial TCP connection to MongoDB
  // Increase if experiencing connection timeouts
  connect: parseInt(
    process.env.DB_CONNECT_TIMEOUT || "10000",
  ),
};


export const apiTimeouts = {
  // General HTTP request timeout
  // Used for all REST API calls unless otherwise specified
  // Covers requests to external services like payment gateways, SMS APIs, etc.
  request: parseInt(
    process.env.API_REQUEST_TIMEOUT || "15000",
  ),

  // Axios global timeout
  // Fallback if no specific timeout is set
  // Used by Axios HTTP client
  axios: parseInt(
    process.env.AXIOS_TIMEOUT || "15000",
  ),

  // Payment gateway API timeout
  // Used for Cashfree, Razorpay, and other payment processing calls
  // Longer timeout because payment processing can take time
  payment: parseInt(
    process.env.PAYMENT_API_TIMEOUT || "30000",
  ),

  // Notification service timeout
  // Used for SMS, Email, and WebSocket notifications
  // Shorter timeout because notifications are non-critical
  notification: parseInt(
    process.env.NOTIFICATION_API_TIMEOUT || "10000",
  ),

  // File upload timeout
  // Used for S3, CloudFront, and other file services
  // Longer timeout for large file uploads
  fileUpload: parseInt(
    process.env.FILE_UPLOAD_TIMEOUT || "60000",
  ),

  // Third-party API timeout
  // Used for external API calls not covered above
  external: parseInt(
    process.env.EXTERNAL_API_TIMEOUT || "20000",
  ),
};


export const serverTimeouts = {
  // Request timeout for incoming HTTP requests
  // Prevents long-running requests from hanging
  request: parseInt(
    process.env.SERVER_REQUEST_TIMEOUT || "300000", // 5 minutes
  ),

  // Keep-alive timeout
  // Prevents idle connections from staying open
  keepAlive: parseInt(
    process.env.SERVER_KEEPALIVE_TIMEOUT || "65000", // 65 seconds
  ),

  // Heartbeat interval for WebSocket connections
  // Keeps WebSocket connections alive
  websocket: parseInt(
    process.env.WEBSOCKET_TIMEOUT || "30000", // 30 seconds
  ),
};


export const operationTimeouts = {
  // File processing timeout
  // Used for image resizing, PDF generation, etc.
  fileProcessing: parseInt(
    process.env.FILE_PROCESSING_TIMEOUT || "60000", // 1 minute
  ),

  // Email sending timeout
  // Used for transactional emails
  emailSend: parseInt(
    process.env.EMAIL_SEND_TIMEOUT || "10000", // 10 seconds
  ),

  // Certificate generation timeout
  // Used for generating course completion certificates
  certificateGeneration: parseInt(
    process.env.CERTIFICATE_GENERATION_TIMEOUT || "30000", // 30 seconds
  ),

  // Exam auto-submit timeout
  // Used for automatically submitting exams when timer expires
  examAutoSubmit: parseInt(
    process.env.EXAM_AUTO_SUBMIT_TIMEOUT || "5000", // 5 seconds
  ),

  // Progress sync timeout
  // Used for syncing user progress to database
  progressSync: parseInt(
    process.env.PROGRESS_SYNC_TIMEOUT || "5000", // 5 seconds
  ),
};


export const getAllTimeouts = () => ({
  database: dbTimeouts,
  api: apiTimeouts,
  server: serverTimeouts,
  operations: operationTimeouts,
});


export const logTimeoutConfiguration = () => {
  if (process.env.NODE_ENV === "development") {
    logger.info("Timeout Configuration Loaded:", {
      database: dbTimeouts,
      api: apiTimeouts,
      server: serverTimeouts,
      operations: operationTimeouts,
    });
  }
};


export const validateTimeouts = () => {
  const allTimeouts = getAllTimeouts();

  const validateObject = (obj, path = "") => {
    Object.entries(obj).forEach(([key, value]) => {
      const fullPath = path ? `${path}.${key}` : key;
      if (typeof value === "object") {
        validateObject(value, fullPath);
      } else if (typeof value === "number") {
        if (value < 0) {
          logger.warn(`Invalid timeout value (negative): ${fullPath} = ${value}`);
        } else if (value > 600000) { // 10 minutes
          logger.warn(`Unusually high timeout value: ${fullPath} = ${value}ms (${Math.round(value / 1000)}s)`);
        }
      }
    });
  };

  validateObject(allTimeouts);
};

// Log configuration on module load
if (process.env.NODE_ENV !== "test") {
  logTimeoutConfiguration();
  validateTimeouts();
}

export default {
  dbTimeouts,
  apiTimeouts,
  serverTimeouts,
  operationTimeouts,
  getAllTimeouts,
};
