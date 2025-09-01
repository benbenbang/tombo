/**
 * HTTP client abstraction with retry logic and proper error handling
 * Handles PyPI API communication with robust URL handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { PyPIClientConfig, RequestOptions } from '../types/pypi';
import { ErrorFactory, PyPIError, TimeoutError } from '../../core/errors/pypi-errors';

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly config: PyPIClientConfig;

  constructor(config: PyPIClientConfig) {
    this.config = config;
    this.axiosInstance = this.createAxiosInstance();
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate'
      },
      // Ensure proper URL handling
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });
  }

  /**
   * Makes GET request with retry logic and proper error handling
   */
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const requestConfig: AxiosRequestConfig = {
      timeout: options.timeout || this.config.timeout,
      headers: options.headers
    };

    const maxAttempts = options.retryAttempts ?? this.config.retryAttempts;
    const delay = options.retryDelay ?? this.config.retryDelay;

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response: AxiosResponse<T> = await this.axiosInstance.get(url, requestConfig);

        // Handle different status codes appropriately
        if (response.status >= 200 && response.status < 300) {
          return response.data;
        }

        // Convert HTTP errors to PyPI errors
        throw ErrorFactory.fromAxiosError({
          response,
          code: `HTTP_${response.status}`
        });

      } catch (error) {
        lastError = error as Error;

        // Convert axios errors to structured PyPI errors
        const pypiError = ErrorFactory.fromAxiosError(error);

        // Don't retry on certain errors
        if (this.shouldNotRetry(pypiError) || attempt === maxAttempts) {
          throw pypiError;
        }

        // Wait before retrying
        if (attempt < maxAttempts) {
          await this.sleep(delay * Math.pow(2, attempt - 1)); // Exponential backoff
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    throw ErrorFactory.fromGenericError(lastError || new Error('Unknown error'));
  }

  /**
   * Determines if an error should not be retried
   */
  private shouldNotRetry(error: PyPIError): boolean {
    return error.code === 'PACKAGE_NOT_FOUND' ||
           error.code === 'INVALID_RESPONSE' ||
           (error.code === 'RATE_LIMITED' && !error.retryAfter);
  }

  /**
   * Utility method for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Properly joins URL paths avoiding double slashes
   */
  static joinUrl(baseUrl: string, ...paths: string[]): string {
    // Remove trailing slash from base URL
    let url = baseUrl.replace(/\/+$/, '');

    for (const path of paths) {
      if (path) {
        // Remove leading/trailing slashes from path parts
        const cleanPath = path.replace(/^\/+|\/+$/g, '');
        if (cleanPath) {
          url += '/' + cleanPath;
        }
      }
    }

    return url;
  }

  /**
   * Updates the base URL for the client
   */
  updateBaseUrl(baseUrl: string): void {
    this.axiosInstance.defaults.baseURL = baseUrl;
  }

  /**
   * Gets current configuration
   */
  getConfig(): PyPIClientConfig {
    return { ...this.config };
  }
}
