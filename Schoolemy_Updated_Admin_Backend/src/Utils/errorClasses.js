// Base application error — carries HTTP statusCode so global handler uses it directly
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode; // compatibility with existing handler that reads err.status
    this.code = code;
    this.details = details;
    this.isOperational = true; // marks expected errors (vs programmer bugs)
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details = null) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", details = null) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

export class PermissionError extends AppError {
  constructor(message = "Access denied", details = null) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, "CONFLICT", details);
  }
}

export class S3UploadError extends AppError {
  constructor(message, details = null) {
    super(message, 502, "S3_UPLOAD_FAILED", details);
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed", details = null) {
    super(message, 503, "DATABASE_ERROR", details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable", details = null) {
    super(message, 503, "SERVICE_UNAVAILABLE", details);
  }
}
