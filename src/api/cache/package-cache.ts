/**
 * Smart caching layer for PyPI package data
 * Implements LRU cache with TTL and size limits
 */

import { CacheConfig } from '../types/pypi';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class PackageCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanup();
  }

  /**
   * Get cached data if still valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  /**
   * Set data in cache with optional custom TTL
   */
  set<T>(key: string, data: T, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl || this.config.ttl;

    // Check if cache is at capacity
    if (this.cache.size >= this.config.maxKeys) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists and is still valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    return {
      totalKeys: this.cache.size,
      maxKeys: this.config.maxKeys,
      expired: entries.filter(e => now - e.timestamp > e.ttl * 1000).length,
      averageAge: entries.length > 0
        ? entries.reduce((sum, e) => sum + (now - e.timestamp), 0) / entries.length / 1000
        : 0,
      totalAccessCount: entries.reduce((sum, e) => sum + e.accessCount, 0)
    };
  }

  /**
   * Generate cache key for package metadata
   */
  static packageKey(packageName: string, includePreReleases = false): string {
    return `pkg:${packageName.toLowerCase()}:${includePreReleases ? 'pre' : 'stable'}`;
  }

  /**
   * Generate cache key for package versions
   */
  static versionsKey(packageName: string): string {
    return `versions:${packageName.toLowerCase()}`;
  }

  /**
   * Generate cache key for package info details
   */
  static packageInfoKey(packageName: string): string {
    return `info:${packageName.toLowerCase()}`;
  }

  /**
   * Generate cache key for connectivity check
   */
  static connectivityKey(baseUrl: string): string {
    return `connectivity:${baseUrl}`;
  }

  /**
   * Evict least recently used entry when cache is full
   */
  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, this.config.checkPeriod * 1000);
  }

  /**
   * Remove expired entries from cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl * 1000) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Stop cleanup interval and clear cache
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}
