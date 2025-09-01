/**
 * Comprehensive TypeScript types for PyPI API responses
 * Based on PyPI JSON API specification
 */

export interface PyPIPackageInfo {
  author: string;
  author_email: string;
  bugtrack_url: string | null;
  classifiers: string[];
  description: string;
  description_content_type: string;
  docs_url: string | null;
  download_url: string | null;
  downloads: {
    last_day: number;
    last_month: number;
    last_week: number;
  };
  home_page: string;
  keywords: string;
  license: string;
  maintainer: string;
  maintainer_email: string;
  name: string;
  package_url: string;
  platform: string;
  project_url: string;
  project_urls: Record<string, string>;
  release_url: string;
  requires_dist: string[] | null;
  requires_python: string | null;
  summary: string;
  version: string;
  yanked: boolean;
  yanked_reason: string | null;
}

export interface PyPIReleaseFile {
  comment_text: string;
  digests: {
    blake2b_256: string;
    md5: string;
    sha256: string;
  };
  downloads: number;
  filename: string;
  has_sig: boolean;
  md5_digest: string;
  packagetype: 'bdist_wheel' | 'sdist' | 'bdist_egg' | 'bdist_wininst';
  python_version: string;
  requires_python: string | null;
  size: number;
  upload_time: string;
  upload_time_iso_8601: string;
  url: string;
  yanked: boolean;
  yanked_reason: string | null;
}

export interface PyPIPackageResponse {
  info: PyPIPackageInfo;
  last_serial: number;
  releases: Record<string, PyPIReleaseFile[]>;
  urls: PyPIReleaseFile[];
  vulnerabilities: any[];
}

export interface PackageMetadata {
  name: string;
  versions: string[];
  latestVersion: string;
  summary: string;
  classifiers: string[];
  requiresPython: string | null;
  yankedVersions: Set<string>;
  preReleaseVersions: Set<string>;
}

export interface PyPIClientConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  userAgent: string;
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxKeys: number;
  checkPeriod: number;
}

export interface PyPIError {
  code: 'NETWORK_ERROR' | 'PACKAGE_NOT_FOUND' | 'INVALID_RESPONSE' | 'TIMEOUT' | 'RATE_LIMITED';
  message: string;
  packageName?: string;
  originalError?: Error;
  retryAfter?: number;
}

export interface RequestOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface VersionInfo {
  version: string;
  isPreRelease: boolean;
  isYanked: boolean;
  yankedReason?: string;
  releaseDate: Date;
  requiresPython?: string;
}
