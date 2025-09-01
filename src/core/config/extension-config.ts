/**
 * Extension configuration management
 * Centralized handling of VS Code settings and configuration
 */

import { workspace, ConfigurationChangeEvent } from 'vscode';
import { PyPIClientConfig, CacheConfig } from '../../api/types/pypi';

export interface TomboConfig {
  pypiIndexUrl: string;
  listPreReleases: boolean;
  showNotifications: 'off' | 'onError' | 'onWarning' | 'always';
  compatibleDecorator: string;
  incompatibleDecorator: string;
  errorDecorator: string;
  compatibleDecoratorCss: any;
  incompatibleDecoratorCss: any;
  errorDecoratorCss: any;
  requestTimeout: number;
  cacheTimeoutMinutes: number;
  maxCacheSize: number;
  retryAttempts: number;
}

export class ExtensionConfig {
  private static instance: ExtensionConfig;
  private config: TomboConfig;
  private readonly configSection = 'tombo';

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ExtensionConfig {
    if (!ExtensionConfig.instance) {
      ExtensionConfig.instance = new ExtensionConfig();
    }
    return ExtensionConfig.instance;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<TomboConfig> {
    return { ...this.config };
  }

  /**
   * Get PyPI client configuration
   */
  getPyPIClientConfig(): PyPIClientConfig {
    return {
      baseUrl: this.config.pypiIndexUrl,
      timeout: this.config.requestTimeout,
      retryAttempts: this.config.retryAttempts,
      retryDelay: 1000, // Fixed 1 second delay
      userAgent: 'tombo-vscode-extension/1.0.0'
    };
  }

  /**
   * Get cache configuration
   */
  getCacheConfig(): CacheConfig {
    return {
      ttl: this.config.cacheTimeoutMinutes * 60, // Convert minutes to seconds
      maxKeys: this.config.maxCacheSize,
      checkPeriod: 300 // 5 minutes cleanup interval
    };
  }

  /**
   * Update configuration when VS Code settings change
   */
  onConfigurationChange(event: ConfigurationChangeEvent): boolean {
    if (event.affectsConfiguration(this.configSection)) {
      const oldConfig = { ...this.config };
      this.config = this.loadConfig();

      return this.hasSignificantChange(oldConfig, this.config);
    }
    return false;
  }

  /**
   * Load configuration from VS Code settings
   */
  private loadConfig(): TomboConfig {
    const config = workspace.getConfiguration(this.configSection);

    return {
      pypiIndexUrl: this.normalizeUrl(config.get<string>('pypiIndexUrl', 'https://pypi.org/pypi')),
      listPreReleases: config.get<boolean>('listPreReleases', false),
      showNotifications: config.get<'off' | 'onError' | 'onWarning' | 'always'>('showNotifications', 'onError'),
      compatibleDecorator: config.get<string>('compatibleDecorator', ' ✓'),
      incompatibleDecorator: config.get<string>('incompatibleDecorator', ' ⚠'),
      errorDecorator: config.get<string>('errorDecorator', ' ⚠️'),
      compatibleDecoratorCss: config.get<any>('compatibleDecoratorCss', {
        after: { color: '#73c991' }
      }),
      incompatibleDecoratorCss: config.get<any>('incompatibleDecoratorCss', {
        after: { color: '#ff7b00' }
      }),
      errorDecoratorCss: config.get<any>('errorDecoratorCss', {
        after: { color: '#ff0000' }
      }),
      requestTimeout: config.get<number>('requestTimeout', 10000),
      cacheTimeoutMinutes: config.get<number>('cacheTimeoutMinutes', 10),
      maxCacheSize: config.get<number>('maxCacheSize', 1000),
      retryAttempts: config.get<number>('retryAttempts', 3)
    };
  }

  /**
   * Normalize PyPI URL to ensure proper format
   */
  private normalizeUrl(url: string): string {
    // Remove trailing slash
    url = url.replace(/\/+$/, '');

    // Ensure HTTPS for security
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }

    // Default to standard PyPI if URL is invalid
    try {
      new URL(url);
      return url;
    } catch {
      return 'https://pypi.org/pypi';
    }
  }

  /**
   * Check if configuration changes require service restart
   */
  private hasSignificantChange(oldConfig: TomboConfig, newConfig: TomboConfig): boolean {
    const significantFields: (keyof TomboConfig)[] = [
      'pypiIndexUrl',
      'requestTimeout',
      'cacheTimeoutMinutes',
      'maxCacheSize',
      'retryAttempts'
    ];

    return significantFields.some(field => oldConfig[field] !== newConfig[field]);
  }

  /**
   * Validate configuration and return any issues
   */
  validateConfig(): string[] {
    const issues: string[] = [];

    if (this.config.requestTimeout < 1000 || this.config.requestTimeout > 60000) {
      issues.push('Request timeout should be between 1-60 seconds');
    }

    if (this.config.cacheTimeoutMinutes < 1 || this.config.cacheTimeoutMinutes > 1440) {
      issues.push('Cache timeout should be between 1-1440 minutes');
    }

    if (this.config.maxCacheSize < 10 || this.config.maxCacheSize > 10000) {
      issues.push('Max cache size should be between 10-10000 entries');
    }

    if (this.config.retryAttempts < 1 || this.config.retryAttempts > 10) {
      issues.push('Retry attempts should be between 1-10');
    }

    try {
      new URL(this.config.pypiIndexUrl);
    } catch {
      issues.push('PyPI index URL is not a valid URL');
    }

    return issues;
  }
}
