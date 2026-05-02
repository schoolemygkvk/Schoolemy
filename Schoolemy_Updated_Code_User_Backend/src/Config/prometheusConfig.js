

import promClient from "prom-client";

// Enable default metrics (CPU, memory, GC, etc.)
promClient.collectDefaultMetrics();


export const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

export const httpRequestTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

export const httpRequestSize = new promClient.Histogram({
  name: "http_request_size_bytes",
  help: "Size of HTTP request bodies in bytes",
  labelNames: ["method", "route"],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

export const httpResponseSize = new promClient.Histogram({
  name: "http_response_size_bytes",
  help: "Size of HTTP response bodies in bytes",
  labelNames: ["method", "route", "status_code"],
  buckets: [100, 1000, 10000, 100000, 1000000],
});


export const dbConnectionPoolSize = new promClient.Gauge({
  name: "db_connection_pool_size",
  help: "Current size of database connection pool",
});

export const dbConnectionPoolWaiting = new promClient.Gauge({
  name: "db_connection_pool_waiting",
  help: "Number of connections waiting for pool slot",
});

export const dbQueryDuration = new promClient.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "collection"],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const dbQueryErrors = new promClient.Counter({
  name: "db_query_errors_total",
  help: "Total number of database query errors",
  labelNames: ["operation", "error_type"],
});

export const dbConnectionErrors = new promClient.Counter({
  name: "db_connection_errors_total",
  help: "Total number of database connection errors",
  labelNames: ["error_type"],
});


export const authLoginAttempts = new promClient.Counter({
  name: "auth_login_attempts_total",
  help: "Total number of login attempts",
  labelNames: ["result"], // success, failure, rate_limited
});

export const authRegistrations = new promClient.Counter({
  name: "auth_registrations_total",
  help: "Total number of user registrations",
  labelNames: ["result"], // success, failure, validation_error
});

export const authOtpVerifications = new promClient.Counter({
  name: "auth_otp_verifications_total",
  help: "Total number of OTP verification attempts",
  labelNames: ["result"], // success, failure, expired
});

export const authRateLimitExceeded = new promClient.Counter({
  name: "auth_rate_limit_exceeded_total",
  help: "Total number of rate limit violations on auth endpoints",
  labelNames: ["endpoint", "ip_hash"],
});

export const authTokensGenerated = new promClient.Counter({
  name: "auth_tokens_generated_total",
  help: "Total number of JWT tokens generated",
  labelNames: ["token_type"], // access, refresh
});


export const paymentTransactionDuration = new promClient.Histogram({
  name: "payment_transaction_duration_seconds",
  help: "Duration of payment transaction processing in seconds",
  labelNames: ["gateway", "status"],
  buckets: [0.5, 1, 2, 5, 10, 30],
});

export const paymentTransactionsTotal = new promClient.Counter({
  name: "payment_transactions_total",
  help: "Total number of payment transactions",
  labelNames: ["gateway", "status"], // success, failed, pending
});

export const paymentTransactionAmount = new promClient.Histogram({
  name: "payment_transaction_amount",
  help: "Amount of payment transactions",
  labelNames: ["gateway"],
  buckets: [100, 500, 1000, 5000, 10000, 50000],
});

export const paymentErrors = new promClient.Counter({
  name: "payment_errors_total",
  help: "Total number of payment errors",
  labelNames: ["gateway", "error_type"],
});


export const courseEnrollments = new promClient.Counter({
  name: "course_enrollments_total",
  help: "Total number of course enrollments",
  labelNames: ["course_id", "status"],
});

export const courseLessonsCompleted = new promClient.Counter({
  name: "course_lessons_completed_total",
  help: "Total number of lesson completions",
  labelNames: ["course_id"],
});

export const certificatesGenerated = new promClient.Counter({
  name: "certificates_generated_total",
  help: "Total number of certificates generated",
  labelNames: ["course_id"],
});

export const examsSubmitted = new promClient.Counter({
  name: "exams_submitted_total",
  help: "Total number of exam submissions",
  labelNames: ["course_id", "result"], // passed, failed, incomplete
});


export const errorsCaught = new promClient.Counter({
  name: "errors_caught_total",
  help: "Total number of caught errors",
  labelNames: ["error_type", "endpoint"],
});

export const unhandledRejections = new promClient.Counter({
  name: "unhandled_rejections_total",
  help: "Total number of unhandled promise rejections",
  labelNames: ["error_type"],
});

export const uncaughtExceptions = new promClient.Counter({
  name: "uncaught_exceptions_total",
  help: "Total number of uncaught exceptions",
  labelNames: ["error_type"],
});

export const httpErrorResponses = new promClient.Counter({
  name: "http_error_responses_total",
  help: "Total number of HTTP error responses",
  labelNames: ["status_code", "endpoint"],
});


export const activeUsers = new promClient.Gauge({
  name: "active_users_total",
  help: "Current number of active users",
});

export const totalUsers = new promClient.Counter({
  name: "total_users_registered",
  help: "Total number of registered users",
});

export const totalCourses = new promClient.Gauge({
  name: "total_courses",
  help: "Total number of available courses",
});

export const totalEnrollments = new promClient.Gauge({
  name: "total_enrollments",
  help: "Total number of enrollments",
});


export const emailSendDuration = new promClient.Histogram({
  name: "email_send_duration_seconds",
  help: "Duration of email sending in seconds",
  labelNames: ["email_type"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const emailSendErrors = new promClient.Counter({
  name: "email_send_errors_total",
  help: "Total number of email sending errors",
  labelNames: ["email_type"],
});

export const smsSendDuration = new promClient.Histogram({
  name: "sms_send_duration_seconds",
  help: "Duration of SMS sending in seconds",
  labelNames: ["sms_type"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const smsSendErrors = new promClient.Counter({
  name: "sms_send_errors_total",
  help: "Total number of SMS sending errors",
  labelNames: ["sms_type"],
});

export const s3UploadDuration = new promClient.Histogram({
  name: "s3_upload_duration_seconds",
  help: "Duration of S3 file uploads in seconds",
  labelNames: ["file_type"],
  buckets: [0.5, 1, 2, 5, 10, 30],
});

export const s3UploadErrors = new promClient.Counter({
  name: "s3_upload_errors_total",
  help: "Total number of S3 upload errors",
  labelNames: ["file_type"],
});


export const cacheHits = new promClient.Counter({
  name: "cache_hits_total",
  help: "Total number of cache hits",
  labelNames: ["cache_name"],
});

export const cacheMisses = new promClient.Counter({
  name: "cache_misses_total",
  help: "Total number of cache misses",
  labelNames: ["cache_name"],
});

export const cacheSize = new promClient.Gauge({
  name: "cache_size_bytes",
  help: "Current size of cache in bytes",
  labelNames: ["cache_name"],
});


export const queueLength = new promClient.Gauge({
  name: "queue_length",
  help: "Current length of job queue",
  labelNames: ["queue_name"],
});

export const queueJobsDuration = new promClient.Histogram({
  name: "queue_job_duration_seconds",
  help: "Duration of queue job processing in seconds",
  labelNames: ["queue_name", "job_type"],
  buckets: [1, 5, 10, 30, 60],
});

export const queueJobsErrors = new promClient.Counter({
  name: "queue_jobs_errors_total",
  help: "Total number of queue job errors",
  labelNames: ["queue_name", "job_type"],
});


export const websocketConnections = new promClient.Gauge({
  name: "websocket_connections",
  help: "Current number of active WebSocket connections",
});

export const websocketMessagesTotal = new promClient.Counter({
  name: "websocket_messages_total",
  help: "Total number of WebSocket messages sent",
  labelNames: ["message_type"],
});

export const websocketConnectionErrors = new promClient.Counter({
  name: "websocket_connection_errors_total",
  help: "Total number of WebSocket connection errors",
  labelNames: ["error_type"],
});


export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // Track request size
  const contentLength = req.get("content-length");
  if (contentLength) {
    httpRequestSize.labels(req.method, req.route?.path || req.path).observe(parseInt(contentLength));
  }

  // Track response
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    // Record metrics
    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode).inc();

    // Track response size
    const responseLength = res.get("content-length");
    if (responseLength) {
      httpResponseSize.labels(req.method, route, res.statusCode).observe(parseInt(responseLength));
    }

    // Track errors
    if (res.statusCode >= 400) {
      httpErrorResponses.labels(res.statusCode, route).inc();
    }
  });

  next();
};


export const register = promClient.register;


export const clearMetric = (metric) => {
  try {
    promClient.register.removeSingleMetric(metric.name);
  } catch (e) {
    // Metric may not exist yet
  }
};


export const getMetrics = () => {
  return promClient.register.metrics();
};

export default {
  metricsMiddleware,
  getMetrics,
  // HTTP Metrics
  httpRequestDuration,
  httpRequestTotal,
  httpRequestSize,
  httpResponseSize,
  // Database Metrics
  dbConnectionPoolSize,
  dbQueryDuration,
  dbQueryErrors,
  // Auth Metrics
  authLoginAttempts,
  authRegistrations,
  authOtpVerifications,
  authRateLimitExceeded,
  // Payment Metrics
  paymentTransactionDuration,
  paymentTransactionsTotal,
  paymentErrors,
  // Business Metrics
  courseEnrollments,
  courseLessonsCompleted,
  certificatesGenerated,
  examsSubmitted,
  // Error Metrics
  errorsCaught,
  unhandledRejections,
  uncaughtExceptions,
};
