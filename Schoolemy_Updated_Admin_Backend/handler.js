import serverless from "serverless-http";
import app from "./server.js";
import connectDB from "./src/DB/db.js";
import { autoSeedRBAC } from "./src/Utils/autoSeed.js";

// Initialize connection outside handler for reuse across warm starts
let isConnected = false;
let isSeeded = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;

// Strip API Gateway stage (e.g. /dev) from path so Express routes match
const API_STAGE = process.env.API_STAGE || "dev";
const serverlessHandler = serverless(app, {
  basePath: `/${API_STAGE}`,
  request: (request, event, context) => {
    // Don't wait for empty event loop (allows Lambda to reuse connections)
    if (context && "callbackWaitsForEmptyEventLoop" in context) {
      context.callbackWaitsForEmptyEventLoop = false;
    }
  },
});

export const handler = async (event, context) => {
  console.log("[HANDLER] Lambda handler invoked -", event.path || event.rawPath);

  if (typeof context?.getRemainingTime === "function") {
  }

  // Ensure MongoDB connection before handling request
  if (!isConnected) {
    try {
      connectionAttempts++;
      console.log(
        `[DB] MongoDB Connection Attempt ${connectionAttempts}/${MAX_RETRIES}`
      );

      await connectDB();
      isConnected = true;
      connectionAttempts = 0;

      // Auto-seed RBAC roles on first connection
      if (!isSeeded) {
        try {
          await autoSeedRBAC();
          isSeeded = true;
        } catch (seedError) {
          // Don't throw - allow request to proceed even if seed fails
        }
      }
    } catch (error) {

      // Retry logic for transient failures
      if (connectionAttempts < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        // Reset and retry by calling handler recursively (max 3 times)
        return handler(event, context);
      }

      return {
        statusCode: 503,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Database connection failed",
          details: error.message,
          attempt: connectionAttempts,
        }),
      };
    }
  }

  try {
    const response = await serverlessHandler(event, context);
    return response;
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
    };
  }
};
