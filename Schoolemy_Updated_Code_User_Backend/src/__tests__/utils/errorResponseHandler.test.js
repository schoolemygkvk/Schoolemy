

import {
  sanitizeError,
  formatErrorResponse,
  createSafeError,
  handleFileUploadError,
  handleJsonError,
  handleDatabaseError,
  handleAuthError,
  handleValidationErrors,
  handleExternalApiError,
} from "../../Utils/errorResponseHandler.js";

describe("Error Response Handler Utils", () => {
  describe("sanitizeError", () => {
    test("sanitizes generic error", () => {
      const error = new Error("Test error message");
      const result = sanitizeError(error, "Test context", false);
      expect(result).toHaveProperty("userMessage");
      expect(result).toHaveProperty("internalMessage");
      expect(result).toHaveProperty("statusCode");
      expect(result.statusCode).toBe(500);
    });

    test("maps ValidationError to user-friendly message", () => {
      const error = new Error("Validation failed");
      error.name = "ValidationError";
      const result = sanitizeError(error, "User registration", false);
      expect(result.userMessage).toContain("Invalid input");
    });

    test("maps CastError to user-friendly message", () => {
      const error = new Error("Invalid ID");
      error.name = "CastError";
      const result = sanitizeError(error, "Query", false);
      expect(result.userMessage).toContain("Invalid identifier");
    });

    test("maps MongoError to user-friendly message", () => {
      const error = new Error("MongoDB error");
      error.name = "MongoError";
      const result = sanitizeError(error, "Database", false);
      expect(result.userMessage).toContain("Database error");
    });

    test("maps connection refused error", () => {
      const error = new Error("ECONNREFUSED: Connection refused");
      const result = sanitizeError(error, "Service", false);
      expect(result.userMessage).toContain("unavailable");
    });

    test("maps timeout error", () => {
      const error = new Error("ETIMEDOUT: Connection timeout");
      const result = sanitizeError(error, "Service", false);
      expect(result.userMessage).toContain("timeout");
    });

    test("maps 400 status code", () => {
      const error = new Error("Bad request");
      error.statusCode = 400;
      const result = sanitizeError(error, "Request", false);
      expect(result.userMessage).toContain("Invalid request");
    });

    test("maps 401 status code", () => {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      const result = sanitizeError(error, "Auth", false);
      expect(result.userMessage).toContain("Unauthorized");
    });

    test("maps 403 status code", () => {
      const error = new Error("Forbidden");
      error.statusCode = 403;
      const result = sanitizeError(error, "Access", false);
      expect(result.userMessage).toContain("permission");
    });

    test("maps 404 status code", () => {
      const error = new Error("Not found");
      error.statusCode = 404;
      const result = sanitizeError(error, "Query", false);
      expect(result.userMessage).toContain("not found");
    });

    test("maps 409 status code", () => {
      const error = new Error("Conflict");
      error.statusCode = 409;
      const result = sanitizeError(error, "Create", false);
      expect(result.userMessage).toContain("already exists");
    });

    test("maps 429 status code", () => {
      const error = new Error("Too many requests");
      error.statusCode = 429;
      const result = sanitizeError(error, "API", false);
      expect(result.userMessage).toContain("Too many requests");
    });

    test("includes debug info in development mode", () => {
      const error = new Error("Debug this error");
      error.code = "DEBUG_CODE";
      const result = sanitizeError(error, "Debug", true);
      expect(result.isDevelopment).toBe(true);
      expect(result.debugInfo).toBeDefined();
      expect(result.debugInfo.message).toBe("Debug this error");
      expect(result.debugInfo.code).toBe("DEBUG_CODE");
    });

    test("excludes debug info in production mode", () => {
      const error = new Error("Production error");
      const result = sanitizeError(error, "Prod", false);
      expect(result.isDevelopment).toBe(false);
      expect(result.debugInfo).toBeUndefined();
    });

    test("uses default status code 500", () => {
      const error = new Error("No status specified");
      const result = sanitizeError(error, "Test", false);
      expect(result.statusCode).toBe(500);
    });

    test("preserves custom status code", () => {
      const error = new Error("Custom status");
      error.statusCode = 418;
      const result = sanitizeError(error, "Test", false);
      expect(result.statusCode).toBe(418);
    });
  });

  describe("formatErrorResponse", () => {
    test("formats error response correctly", () => {
      const error = new Error("Test error");
      error.statusCode = 400;
      const result = formatErrorResponse(error, "Test", false);
      expect(result).toHaveProperty("success", false);
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("statusCode", 400);
      expect(result).toHaveProperty("code");
    });

    test("includes error code", () => {
      const error = new Error("Test error");
      error.code = "TEST_CODE";
      const result = formatErrorResponse(error, "Test", false);
      expect(result.code).toBe("TEST_CODE");
    });

    test("uses INTERNAL_ERROR as default code", () => {
      const error = new Error("Test error");
      const result = formatErrorResponse(error, "Test", false);
      expect(result.code).toBe("INTERNAL_ERROR");
    });

    test("includes debug info only in development", () => {
      const error = new Error("Debug test");
      error.code = "DEBUG_CODE";
      const resultProd = formatErrorResponse(error, "Test", false);
      const resultDev = formatErrorResponse(error, "Test", true);
      expect(resultProd.debug).toBeUndefined();
      expect(resultDev.debug).toBeDefined();
    });
  });

  describe("createSafeError", () => {
    test("creates safe error with all fields", () => {
      const error = createSafeError("Safe message", 400, "SAFE_CODE");
      expect(error.success).toBe(false);
      expect(error.message).toBe("Safe message");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("SAFE_CODE");
    });

    test("uses default status code 400", () => {
      const error = createSafeError("Message");
      expect(error.statusCode).toBe(400);
    });

    test("uses default error code ERROR", () => {
      const error = createSafeError("Message");
      expect(error.code).toBe("ERROR");
    });

    test("contains no sensitive information", () => {
      const error = createSafeError("User error", 500, "ERR_CODE");
      expect(JSON.stringify(error)).not.toContain("stack");
      expect(JSON.stringify(error)).not.toContain("file");
    });
  });

  describe("handleFileUploadError", () => {
    test("handles LIMIT_FILE_SIZE error", () => {
      const error = new Error("File too large");
      error.code = "LIMIT_FILE_SIZE";
      const result = handleFileUploadError(error, false);
      expect(result.message).toContain("too large");
      expect(result.statusCode).toBe(413);
    });

    test("handles LIMIT_FILE_COUNT error", () => {
      const error = new Error("Too many files");
      error.code = "LIMIT_FILE_COUNT";
      const result = handleFileUploadError(error, false);
      expect(result.message).toContain("Too many files");
      expect(result.statusCode).toBe(400);
    });

    test("handles LIMIT_PART_COUNT error", () => {
      const error = new Error("Too many parts");
      error.code = "LIMIT_PART_COUNT";
      const result = handleFileUploadError(error, false);
      expect(result.message).toContain("Too many form fields");
    });

    test("handles LIMIT_FIELD_SIZE error", () => {
      const error = new Error("Field too large");
      error.code = "LIMIT_FIELD_SIZE";
      const result = handleFileUploadError(error, false);
      expect(result.message).toContain("Field value too large");
    });

    test("handles unknown file upload error", () => {
      const error = new Error("Unknown error");
      const result = handleFileUploadError(error, false);
      expect(result.message).toContain("File upload failed");
      expect(result.statusCode).toBe(400);
    });

    test("includes debug info in development", () => {
      const error = new Error("File error");
      error.code = "TEST_CODE";
      const result = handleFileUploadError(error, true);
      expect(result.code).toBe("TEST_CODE");
    });
  });

  describe("handleJsonError", () => {
    test("returns generic JSON error message", () => {
      const error = new Error("Invalid JSON");
      const result = handleJsonError(error, false);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid JSON");
      expect(result.statusCode).toBe(400);
      expect(result.code).toBe("JSON_PARSE_ERROR");
    });

    test("includes debug info in development", () => {
      const error = new Error("Parse error");
      const result = handleJsonError(error, true);
      expect(result.debug).toBeDefined();
      expect(result.debug.message).toBe("Parse error");
    });

    test("excludes debug info in production", () => {
      const error = new Error("Parse error");
      const result = handleJsonError(error, false);
      expect(result.debug).toBeUndefined();
    });
  });

  describe("handleDatabaseError", () => {
    test("returns generic database error", () => {
      const error = new Error("Database error");
      const result = handleDatabaseError(error, false);
      expect(result.message).toContain("Database error");
      expect(result.statusCode).toBe(503);
      expect(result.code).toBe("DATABASE_ERROR");
    });

    test("handles connection refused error", () => {
      const error = new Error("ECONNREFUSED: Connection refused");
      const result = handleDatabaseError(error, false);
      expect(result.message).toContain("unavailable");
    });

    test("handles timeout error", () => {
      const error = new Error("ETIMEDOUT: Connection timeout");
      const result = handleDatabaseError(error, false);
      expect(result.message).toContain("timeout");
    });

    test("returns 503 status code", () => {
      const error = new Error("DB error");
      const result = handleDatabaseError(error, false);
      expect(result.statusCode).toBe(503);
    });
  });

  describe("handleAuthError", () => {
    test("returns auth error with default message", () => {
      const result = handleAuthError();
      expect(result.message).toBe("Authentication failed");
      expect(result.statusCode).toBe(401);
      expect(result.code).toBe("AUTH_ERROR");
      expect(result.success).toBe(false);
    });

    test("uses custom message", () => {
      const result = handleAuthError("Invalid credentials");
      expect(result.message).toBe("Invalid credentials");
    });

    test("always returns 401 status", () => {
      const result = handleAuthError("Custom error");
      expect(result.statusCode).toBe(401);
    });
  });

  describe("handleValidationErrors", () => {
    test("formats validation errors by field", () => {
      const errors = [
        { param: "email", msg: "Invalid email" },
        { param: "password", msg: "Too short" },
        { param: "email", msg: "Already exists" },
      ];
      const result = handleValidationErrors(errors);
      expect(result.fields.email).toHaveLength(2);
      expect(result.fields.password).toHaveLength(1);
    });

    test("includes all error details", () => {
      const errors = [
        { param: "username", msg: "Required" },
      ];
      const result = handleValidationErrors(errors);
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.code).toBe("VALIDATION_ERROR");
    });

    test("groups multiple errors by field", () => {
      const errors = [
        { param: "name", msg: "Required" },
        { param: "name", msg: "Minimum 3 characters" },
      ];
      const result = handleValidationErrors(errors);
      expect(result.fields.name).toEqual(["Required", "Minimum 3 characters"]);
    });

    test("handles empty error array", () => {
      const result = handleValidationErrors([]);
      expect(result.fields).toEqual({});
    });
  });

  describe("handleExternalApiError", () => {
    test("returns generic external API error", () => {
      const error = new Error("API error");
      const result = handleExternalApiError(error, "PaymentGateway", false);
      expect(result.message).toContain("PaymentGateway");
      expect(result.statusCode).toBe(503);
      expect(result.code).toBe("EXTERNAL_API_ERROR");
    });

    test("uses custom API name", () => {
      const error = new Error("Error");
      const result = handleExternalApiError(error, "EmailService", false);
      expect(result.message).toContain("EmailService");
    });

    test("uses default API name", () => {
      const error = new Error("Error");
      const result = handleExternalApiError(error, undefined, false);
      expect(result.message).toContain("External Service");
    });

    test("always returns 503 status", () => {
      const error = new Error("Error");
      const result = handleExternalApiError(error, "Service", false);
      expect(result.statusCode).toBe(503);
    });

    test("excludes sensitive error details", () => {
      const error = new Error("API key invalid");
      const result = handleExternalApiError(error, "Service", false);
      expect(result.message).not.toContain("API key");
    });
  });

  describe("Error message sanitization", () => {
    test("never includes file paths in user message", () => {
      const error = new Error("/path/to/file.js:10:5 - Error");
      error.statusCode = 500;
      const result = sanitizeError(error, "Test", false);
      expect(result.userMessage).not.toContain("/path/to/file");
    });

    test("never includes stack trace in user message", () => {
      const error = new Error("Error with stack");
      error.stack = "Error: test\n  at Function (/file.js:1:1)";
      const result = sanitizeError(error, "Test", false);
      expect(result.userMessage).not.toContain("at Function");
    });

    test("never includes database details in user message", () => {
      const error = new Error("MongoDB connection to 10.0.0.1:27017 failed");
      const result = sanitizeError(error, "DB", false);
      expect(result.userMessage).not.toContain("10.0.0.1");
      expect(result.userMessage).not.toContain("27017");
    });
  });

  describe("Error categorization", () => {
    test("correctly categorizes validation errors", () => {
      const error = new Error("Validation failed");
      error.name = "ValidationError";
      const result = formatErrorResponse(error, "Register", false);
      // formatErrorResponse uses error.code or defaults to INTERNAL_ERROR
      // The message is sanitized based on error.name
      expect(result.message).toContain("Invalid");
    });

    test("correctly categorizes auth errors", () => {
      const authError = handleAuthError("Token expired");
      expect(authError.code).toBe("AUTH_ERROR");
    });

    test("correctly categorizes database errors", () => {
      const error = new Error("Connection timeout");
      const dbError = handleDatabaseError(error, false);
      expect(dbError.code).toBe("DATABASE_ERROR");
    });
  });
});
