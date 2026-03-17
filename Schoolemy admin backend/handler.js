import serverless from "serverless-http";
import app from "./server.js";
import connectDB from "./src/DB/db.js";

// Initialize connection outside handler for reuse across warm starts
let isConnected = false;
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
  console.log("🔵 Lambda Handler Invoked");
  console.log("📌 Event Path:", event?.path);
  console.log("📌 Event Method:", event?.httpMethod);
  if (typeof context?.getRemainingTime === "function") {
    console.log("⏱️ Lambda Timeout:", context.getRemainingTime(), "ms");
  }

  // Ensure MongoDB connection before handling request
  if (!isConnected) {
    try {
      connectionAttempts++;
      console.log(
        `🔄 MongoDB Connection Attempt ${connectionAttempts}/${MAX_RETRIES}`,
      );

      await connectDB();
      isConnected = true;
      connectionAttempts = 0;
      console.log("✅ Lambda: MongoDB connection established");
    } catch (error) {
      console.error("❌ Lambda: MongoDB connection failed:", error.message);

      // Retry logic for transient failures
      if (connectionAttempts < MAX_RETRIES) {
        console.log("⏳ Retrying connection...");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        // Reset and retry by calling handler recursively (max 3 times)
        return handler(event, context);
      }

      return {
        statusCode: 503,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
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
    console.log("✅ Request processed successfully");
    return response;
  } catch (error) {
    console.error("❌ Unhandled Lambda error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
    };
  }
};
