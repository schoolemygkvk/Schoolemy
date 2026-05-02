// Utils/logger.js - Winston-based structured logging
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "../../logs");
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// Ensure logs directory exists in local/dev so file transports do not fail.
// Skip in Lambda where /var/task is read-only
if (!isLambda && !fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (err) {
    // If we can't create logs dir, continue anyway (console logging will still work)
    console.warn("Warning: Could not create logs directory:", err.message);
  }
}

// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

// Define custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  }),
);

// Create transports array
const transports = [];

// Console transport (always in Lambda, always in dev, only errors in production)
if (isLambda || process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

// File transports for production and errors (skip in Lambda since /var/task is read-only)
if (!isLambda && (process.env.NODE_ENV === "production" || logLevel === "debug")) {
  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxDays: "14d",
      level: "error",
      format: customFormat,
    }),
  );

  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxDays: "7d",
      format: customFormat,
    }),
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  defaultMeta: { service: "schoolemy-backend" },
  transports,
  // Handle uncaught exceptions (skip file logging in Lambda)
  exceptionHandlers: isLambda ? [] : [
    new winston.transports.File({ filename: path.join(logsDir, "exceptions.log") }),
  ],
  // Handle unhandled promise rejections (skip file logging in Lambda)
  rejectionHandlers: isLambda ? [] : [
    new winston.transports.File({ filename: path.join(logsDir, "rejections.log") }),
  ],
});

export default logger;
