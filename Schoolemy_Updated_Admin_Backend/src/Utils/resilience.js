import logger from "./logger.js";
import { ServiceUnavailableError } from "./errorClasses.js";

// Retry with exponential backoff
// Retries only on transient errors (network timeouts, 429, 500, 503)
const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);

export async function withRetry(fn, options = {}) {
  const { attempts = 3, baseDelayMs = 1000, label = "operation" } = options;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt === attempts;
      const statusCode = err.$metadata?.httpStatusCode || err.statusCode || err.status;
      const isRetryable = !statusCode || RETRYABLE_CODES.has(statusCode);

      if (isLast || !isRetryable) {
        logger.error({ message: `${label} failed permanently`, attempt, error: err.message, statusCode });
        throw err;
      }

      const delay = baseDelayMs * 2 ** (attempt - 1);
      logger.warn({ message: `${label} failed, retrying`, attempt, delay, error: err.message });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// Simple circuit breaker (no external dep)
// State: CLOSED → OPEN (after failureThreshold failures) → HALF_OPEN (after resetTimeout)
export class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || "service";
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000; // 30s
    this.state = "CLOSED";
    this.failures = 0;
    this.lastFailureTime = null;
  }

  async call(fn) {
    if (this.state === "OPEN") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed < this.resetTimeout) {
        logger.warn({ message: `Circuit ${this.name} OPEN — rejecting call`, elapsed, resetTimeout: this.resetTimeout });
        throw new ServiceUnavailableError(`${this.name} is temporarily unavailable`);
      }
      this.state = "HALF_OPEN";
      logger.info({ message: `Circuit ${this.name} → HALF_OPEN` });
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  _onSuccess() {
    if (this.state === "HALF_OPEN") {
      logger.info({ message: `Circuit ${this.name} → CLOSED (recovered)` });
    }
    this.state = "CLOSED";
    this.failures = 0;
  }

  _onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) {
      logger.error({ message: `Circuit ${this.name} → OPEN after ${this.failures} failures` });
      this.state = "OPEN";
    }
  }
}

// Shared circuit breakers for S3 buckets
export const s3CircuitBreaker = new CircuitBreaker({ name: "S3", failureThreshold: 5, resetTimeout: 30000 });
