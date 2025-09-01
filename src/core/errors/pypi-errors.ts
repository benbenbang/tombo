/**
 * Custom error classes for PyPI API operations
 * Provides structured error handling with proper typing
 */

export class PyPIError extends Error {
  public readonly code: string;
  public readonly packageName?: string;
  public readonly originalError?: Error;
  public readonly retryAfter?: number;

  constructor(
    code: string,
    message: string,
    packageName?: string,
    originalError?: Error,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'PyPIError';
    this.code = code;
    this.packageName = packageName;
    this.originalError = originalError;
    this.retryAfter = retryAfter;

    // Maintain proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PyPIError);
    }
  }

  /**
   * Convert error to JSON-serializable object
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      packageName: this.packageName,
      stack: this.stack,
      retryAfter: this.retryAfter,
      originalError: this.originalError?.message
    };
  }
}

export class NetworkError extends PyPIError {
  constructor(message: string, packageName?: string, originalError?: Error) {
    super('NETWORK_ERROR', message, packageName, originalError);
    this.name = 'NetworkError';
  }
}

export class PackageNotFoundError extends PyPIError {
  constructor(packageName: string) {
    super('PACKAGE_NOT_FOUND', `Package '${packageName}' not found on PyPI`, packageName);
    this.name = 'PackageNotFoundError';
  }
}

export class InvalidResponseError extends PyPIError {
  constructor(message: string, packageName?: string, originalError?: Error) {
    super('INVALID_RESPONSE', message, packageName, originalError);
    this.name = 'InvalidResponseError';
  }
}

export class TimeoutError extends PyPIError {
  constructor(packageName?: string, timeout?: number) {
    const message = `Request timed out${timeout ? ` after ${timeout}ms` : ''}`;
    super('TIMEOUT', message, packageName);
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends PyPIError {
  constructor(retryAfter?: number, packageName?: string) {
    const message = `Rate limited${retryAfter ? `, retry after ${retryAfter}s` : ''}`;
    super('RATE_LIMITED', message, packageName, undefined, retryAfter);
    this.name = 'RateLimitError';
  }
}

/**
 * Error factory for creating appropriate error instances
 */
export class ErrorFactory {
  static fromAxiosError(error: any, packageName?: string): PyPIError {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new NetworkError('Network connection failed', packageName, error);
    }

    if (error.code === 'ECONNABORTED') {
      return new TimeoutError(packageName);
    }

    if (error.response) {
      const { status, headers } = error.response;

      switch (status) {
        case 404:
          return new PackageNotFoundError(packageName || 'unknown');
        case 429:
          const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after']) : undefined;
          return new RateLimitError(retryAfter, packageName);
        case 502:
        case 503:
        case 504:
          return new NetworkError(`Server error (${status})`, packageName, error);
        default:
          return new NetworkError(`HTTP ${status}: ${error.response.statusText}`, packageName, error);
      }
    }

    return new NetworkError(error.message || 'Unknown network error', packageName, error);
  }

  static fromGenericError(error: Error, packageName?: string): PyPIError {
    if (error instanceof PyPIError) {
      return error;
    }

    return new PyPIError('UNKNOWN_ERROR', error.message, packageName, error);
  }
}
