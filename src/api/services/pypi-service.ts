/**
 * Unified PyPI service layer with business logic
 * Combines HTTP client, caching, and error handling
 */

import { PyPIPackageResponse, PackageMetadata, VersionInfo, PyPIClientConfig, CacheConfig, PyPIPackageInfo } from '../types/pypi';
import { HttpClient } from '../clients/http-client';
import { PackageCache } from '../cache/package-cache';
import { PyPIError, PackageNotFoundError, ErrorFactory } from '../../core/errors/pypi-errors';

export class PyPIService {
  private readonly httpClient: HttpClient;
  private readonly cache: PackageCache;

  constructor(
    pypiConfig: PyPIClientConfig,
    cacheConfig: CacheConfig
  ) {
    this.httpClient = new HttpClient(pypiConfig);
    this.cache = new PackageCache(cacheConfig);
  }

  /**
   * Get package metadata with versions and compatibility information
   */
  async getPackageMetadata(packageName: string, includePreReleases: boolean = false): Promise<PackageMetadata> {
    const cacheKey = PackageCache.packageKey(packageName, includePreReleases);

    // Try to get from cache first
    const cached = this.cache.get<PackageMetadata>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.fetchPackageData(packageName);
      const metadata = this.processPackageResponse(response, includePreReleases);

      // Cache the result with standard TTL
      this.cache.set(cacheKey, metadata);

      return metadata;
    } catch (error) {
      throw ErrorFactory.fromGenericError(error as Error, packageName);
    }
  }

  /**
   * Get all available versions for a package
   */
  async getPackageVersions(packageName: string, includePreReleases: boolean = false): Promise<VersionInfo[]> {
    const metadata = await this.getPackageMetadata(packageName, includePreReleases);
    const response = await this.fetchPackageData(packageName);

    return this.processVersionInfo(response, includePreReleases);
  }

  /**
   * Get the latest stable version of a package
   */
  async getLatestVersion(packageName: string): Promise<string> {
    const metadata = await this.getPackageMetadata(packageName, false);
    return metadata.latestVersion;
  }

  /**
   * Check if PyPI is reachable
   */
  async checkConnectivity(): Promise<boolean> {
    const config = this.httpClient.getConfig();
    const cacheKey = PackageCache.connectivityKey(config.baseUrl);

    // Check cache first (short TTL for connectivity checks)
    const cached = this.cache.get<boolean>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      // Try to fetch a lightweight endpoint
      await this.httpClient.get('');
      this.cache.set(cacheKey, true, 30); // Cache for 30 seconds
      return true;
    } catch (error) {
      this.cache.set(cacheKey, false, 30); // Cache failure for 30 seconds
      return false;
    }
  }

  /**
   * Search for packages by name (if PyPI supports it)
   */
  async searchPackages(_query: string, _limit: number = 20): Promise<string[]> {
    // Note: PyPI deprecated the XML-RPC search API
    // This would need to be implemented with a different approach
    // or external search service if needed
    throw new Error('Package search is not currently supported');
  }

  /**
   * Update the PyPI index URL
   */
  updatePyPIUrl(newUrl: string): void {
    this.httpClient.updateBaseUrl(newUrl);
    // Clear cache when URL changes
    this.cache.clear();
  }

  /**
   * Get service statistics and health
   */
  getServiceStats() {
    return {
      cache: this.cache.getStats(),
      config: this.httpClient.getConfig()
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.cache.dispose();
  }

  /**
   * Get full package information including detailed metadata
   */
  async getPackageInfo(packageName: string): Promise<PyPIPackageInfo> {
    const cacheKey = PackageCache.packageInfoKey(packageName);

    // Try to get from cache first
    const cached = this.cache.get<PyPIPackageInfo>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.fetchPackageData(packageName);
      const packageInfo = response.info;

      // Cache the result with standard TTL
      this.cache.set(cacheKey, packageInfo);

      return packageInfo;
    } catch (error) {
      throw ErrorFactory.fromGenericError(error as Error, packageName);
    }
  }

  /**
   * Fetch raw package data from PyPI
   */
  private async fetchPackageData(packageName: string): Promise<PyPIPackageResponse> {
    const url = HttpClient.joinUrl('', packageName, 'json');
    return await this.httpClient.get<PyPIPackageResponse>(url);
  }

  /**
   * Process PyPI response into our metadata format
   */
  private processPackageResponse(response: PyPIPackageResponse, includePreReleases: boolean): PackageMetadata {
    const versions = Object.keys(response.releases);
    const versionInfos = versions.map(version => this.parseVersionInfo(version, response.releases[version]));

    // Filter versions based on preferences
    const filteredVersions = includePreReleases
      ? versionInfos
      : versionInfos.filter(v => !v.isPreRelease);

    // Sort versions (latest first)
    const sortedVersions = this.sortVersions(filteredVersions.map(v => v.version));

    const yankedVersions = new Set(
      versionInfos.filter(v => v.isYanked).map(v => v.version)
    );

    const preReleaseVersions = new Set(
      versionInfos.filter(v => v.isPreRelease).map(v => v.version)
    );

    return {
      name: response.info.name,
      versions: sortedVersions,
      latestVersion: response.info.version,
      summary: response.info.summary,
      classifiers: response.info.classifiers,
      requiresPython: response.info.requires_python,
      yankedVersions,
      preReleaseVersions
    };
  }

  /**
   * Process version information from PyPI response
   */
  private processVersionInfo(response: PyPIPackageResponse, includePreReleases: boolean): VersionInfo[] {
    const versions = Object.keys(response.releases);
    const versionInfos = versions.map(version => this.parseVersionInfo(version, response.releases[version]));

    const filteredVersions = includePreReleases
      ? versionInfos
      : versionInfos.filter(v => !v.isPreRelease);

    return filteredVersions.sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());
  }

  /**
   * Parse version information from release data
   */
  private parseVersionInfo(version: string, releases: any[]): VersionInfo {
    const isPreRelease = this.isPreReleaseVersion(version);
    const firstRelease = releases[0] || {};

    return {
      version,
      isPreRelease,
      isYanked: firstRelease.yanked || false,
      yankedReason: firstRelease.yanked_reason,
      releaseDate: firstRelease.upload_time ? new Date(firstRelease.upload_time) : new Date(),
      requiresPython: firstRelease.requires_python
    };
  }

  /**
   * Determine if a version is a pre-release
   */
  private isPreReleaseVersion(version: string): boolean {
    // Common pre-release patterns
    const preReleasePatterns = [
      /\d+[.\-_]?(a|alpha)\d*/i,
      /\d+[.\-_]?(b|beta)\d*/i,
      /\d+[.\-_]?(rc|c)\d*/i,
      /\d+[.\-_]?(dev)\d*/i,
      /\d+[.\-_]?(pre)\d*/i,
    ];

    return preReleasePatterns.some(pattern => pattern.test(version));
  }

  /**
   * Sort versions in descending order (latest first)
   * Uses semantic version ordering where possible
   */
  private sortVersions(versions: string[]): string[] {
    return versions.sort((a, b) => {
      // Simple version comparison - could be enhanced with proper semver library
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;

        if (aPart !== bPart) {
          return bPart - aPart; // Descending order
        }
      }

      return 0;
    });
  }
}

/**
 * Factory for creating PyPI service instances with default configuration
 */
export class PyPIServiceFactory {
  static create(baseUrl: string = 'https://pypi.org/pypi'): PyPIService {
    const pypiConfig: PyPIClientConfig = {
      baseUrl,
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      userAgent: 'tombo-vscode-extension/1.0.0'
    };

    const cacheConfig: CacheConfig = {
      ttl: 600, // 10 minutes
      maxKeys: 1000,
      checkPeriod: 300 // 5 minutes cleanup interval
    };

    return new PyPIService(pypiConfig, cacheConfig);
  }

  static createWithConfig(pypiConfig: Partial<PyPIClientConfig>, cacheConfig?: Partial<CacheConfig>): PyPIService {
    const defaultPypiConfig: PyPIClientConfig = {
      baseUrl: 'https://pypi.org/pypi',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      userAgent: 'tombo-vscode-extension/1.0.0'
    };

    const defaultCacheConfig: CacheConfig = {
      ttl: 600,
      maxKeys: 1000,
      checkPeriod: 300
    };

    return new PyPIService(
      { ...defaultPypiConfig, ...pypiConfig },
      { ...defaultCacheConfig, ...cacheConfig }
    );
  }
}
