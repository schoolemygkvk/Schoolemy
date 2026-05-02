import { logger } from "../Utils/logger.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Support both MONGO_URL and MONGODB_URI environment variables
const MONGO_URI = process.env.MONGO_URL || process.env.MONGODB_URI;
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const connectDB = async () => {
  try {
    // Skip if already connected (for Lambda reuse)
    if (mongoose.connection.readyState === 1) {
      console.log("[DB] MongoDB already connected (skipping reconnect)");
      return;
    }

    if (!MONGO_URI) {
      const errorMsg = "MongoDB URI not found in environment variables (MONGO_URL or MONGODB_URI)";
      console.error("[DB] ERROR:", errorMsg);
      if (!isLambda) {
        process.exit(1);
      }
      throw new Error(errorMsg);
    }



    // SECURITY FIX 3.28.1: Timeout values are now configurable via environment variables
    // Allows different timeout configurations for development, staging, and production
    const dbServerTimeout = parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || "30000");
    const dbSocketTimeout = parseInt(process.env.DB_SOCKET_TIMEOUT || "45000");
    const dbConnectTimeout = parseInt(process.env.DB_CONNECT_TIMEOUT || "10000");

    const options = {
      serverSelectionTimeoutMS: dbServerTimeout, // Default: 30 seconds
      socketTimeoutMS: dbSocketTimeout,          // Default: 45 seconds
      connectTimeoutMS: dbConnectTimeout,        // Default: 10 seconds (time to establish connection)
      maxPoolSize: isLambda ? 1 : 10,            // Use smaller pool for Lambda
    };

    await mongoose.connect(MONGO_URI, options);
    console.log("[DB]  MongoDB Connected successfully");
    logger.debug("MongoDB Connected successfully");

    mongoose.connection.on("error", (err) => {
      console.error("[DB] Connection error:", err.message);
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {

      logger.warn("MongoDB disconnected");
    });

  } catch (error) {
    console.error("[DB]  Connection failed:", error.message);
    console.error("[DB] Stack trace:", error.stack);
    logger.error("MongoDB Connection Error:", {
      message: error.message,
      stack: error.stack,
    });
    if (!isLambda) {
      process.exit(1); // Only exit in non-Lambda environments
    }
    throw error; // Re-throw for Lambda to handle
  }
};

export const getConnectionState = () => mongoose.connection.readyState;

export default connectDB;