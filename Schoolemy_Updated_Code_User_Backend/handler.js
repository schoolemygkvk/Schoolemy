import serverless from "serverless-http";
import app from "./server.js";
import connectDB, { getConnectionState } from "./src/DB/db.js";

// Wrap serverless handler with binary types
// IMPORTANT: Must match API Gateway binary_media_types configuration
const serverlessHandler = serverless(app, {
  binary: [
    "multipart/form-data",
    "image/*",
    "application/pdf",
    "application/octet-stream",
  ],
  request(request, event, context) {
    // Ensure isBase64Encoded is properly handled for multipart data
    if (event.isBase64Encoded && event.body) {
      request.body = Buffer.from(event.body, "base64");
    }
  },
});


const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "https://schoolemy.com",
  "https://www.schoolemy.com",
  process.env.FRONTEND_URL,
].filter(Boolean);


const getCorsHeaders = (origin = "https://schoolemy.com") => {
  const allowOrigin = allowedOrigins.includes(origin)
    ? origin
    : "https://schoolemy.com";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, x-csrf-token",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
  };
};


const isWarmupEvent = (evt) =>
  evt && (evt.source === "serverless-plugin-warmup" || evt.path === "/_warmup");


const handlePreflightRequest = (event) => {
  const method =
    event.httpMethod ?? event.requestContext?.http?.method ?? "UNKNOWN";
  if (method === "OPTIONS") {
    const origin = event.headers?.origin || event.headers?.Origin || "";
    return {
      statusCode: 200,
      headers: getCorsHeaders(origin),
      body: "",
    };
  }
  return null;
};

export const handler = async (event, context) => {
  // Allow Node.js event loop to be reused across Lambda invocations
  context.callbackWaitsForEmptyEventLoop = false;

  const requestId =
    context.awsRequestId || event.requestContext?.requestId || "unknown";
  const method =
    event.httpMethod ?? event.requestContext?.http?.method ?? "UNKNOWN";
  const path = event.path ?? event.requestContext?.http?.path ?? "/";
  const origin = event.headers?.origin || event.headers?.Origin || "";

  console.info("Lambda invoked", {
    requestId,
    method,
    path,
    source:
      event.requestContext?.identity || event.requestContext?.http || "unknown",
  });

  // Handle CORS preflight requests FIRST
  const preflightResponse = handlePreflightRequest(event);
  if (preflightResponse) {
    console.debug("Preflight OPTIONS request handled", { requestId });
    return preflightResponse;
  }

  // Fast path for warmup requests
  if (isWarmupEvent(event)) {
    console.debug("Warmup event detected, returning 200 quickly");
    return {
      statusCode: 200,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({ ok: true, warmed: true }),
    };
  }

  // Ensure DB is connected (waits for existing connect promise if one is in-flight)
  try {
    await connectDB();
    console.debug("DB connection readyState:", getConnectionState());
  } catch (dbErr) {
    console.error("Unable to connect to DB:", dbErr.message || dbErr, {
      requestId,
    });

    return {
      statusCode: 503,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({
        success: false,
        message: "Service unavailable - database connection failed",
        error: dbErr.message || String(dbErr),
      }),
    };
  }

  try {
    const response = await serverlessHandler(event, context);

    // Some frameworks return undefined or non-standard responses; guard against that
    if (!response || typeof response.statusCode !== "number") {
      console.warn(
        "Unexpected response from serverless handler, normalizing to 200",
        { response, requestId },
      );
      return {
        statusCode: 200,
        headers: getCorsHeaders(origin),
        body: JSON.stringify(response ?? { success: true }),
      };
    }

    // Express middleware (cors) already sets CORS headers
    // Only add Lambda CORS headers if the response doesn't have them (case-insensitive check)
    const responseHeaders = response.headers || {};
    const hasCorsHeader = Object.keys(responseHeaders).some(
      (key) => key.toLowerCase() === "access-control-allow-origin",
    );

    if (!hasCorsHeader) {
      Object.assign(responseHeaders, getCorsHeaders(origin));
    }

    console.info("Request handled", {
      statusCode: response.statusCode,
      requestId,
    });
    return {
      ...response,
      headers: responseHeaders,
    };
  } catch (error) {
    console.error("Lambda handler error:", error, { requestId });
    return {
      statusCode: 500,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message || String(error),
      }),
    };
  }
};

// For local testing, export the serverless handler too
export default serverlessHandler;
