/**
 * API Cache System
 *
 * Minimizes API calls, tracks usage, implements rate limiting
 * Helps stay within OpenRouteService free tier (2,000 requests/day)
 */

import type { APIUsageRecord } from '@/types';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  duration: number;
  key: string;
}

export interface CacheConfig {
  maxSize?: number;
  defaultDuration?: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private usageLog: APIUsageRecord[] = [];
  private maxSize: number;
  private defaultDuration: number;

  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize || 200;
    this.defaultDuration = config.defaultDuration || 1000 * 60 * 60; // 1 hour

    // Load usage log from localStorage
    this.loadUsageLog();
  }

  /**
   * Get cached data if fresh
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.duration) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, duration?: number): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      duration: duration || this.defaultDuration,
      key,
    });
  }

  /**
   * Check if key exists and is fresh
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.duration) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Log API usage
   */
  logUsage(endpoint: string, success: boolean, cached: boolean): void {
    const record: APIUsageRecord = {
      timestamp: Date.now(),
      endpoint,
      success,
      cached,
    };

    this.usageLog.push(record);

    // Keep only last 1000 records
    if (this.usageLog.length > 1000) {
      this.usageLog = this.usageLog.slice(-1000);
    }

    // Persist to localStorage
    this.saveUsageLog();
  }

  /**
   * Get usage stats for today
   */
  getTodayUsage(): {
    total: number;
    cached: number;
    apiCalls: number;
    byEndpoint: Record<string, number>;
  } {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayRecords = this.usageLog.filter(r => r.timestamp >= todayStart);

    const byEndpoint: Record<string, number> = {};
    let apiCalls = 0;
    let cached = 0;

    for (const record of todayRecords) {
      byEndpoint[record.endpoint] = (byEndpoint[record.endpoint] || 0) + 1;
      if (record.cached) {
        cached++;
      } else {
        apiCalls++;
      }
    }

    return {
      total: todayRecords.length,
      cached,
      apiCalls,
      byEndpoint,
    };
  }

  /**
   * Check if within rate limit (2000 calls/day for ORS free tier)
   */
  isWithinRateLimit(limit: number = 2000): boolean {
    const stats = this.getTodayUsage();
    return stats.apiCalls < limit;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: ((this.cache.size / this.maxSize) * 100).toFixed(2) + '%',
    };
  }

  /**
   * Persist usage log to localStorage
   */
  private saveUsageLog(): void {
    try {
      localStorage.setItem('api_usage_log', JSON.stringify(this.usageLog));
    } catch (error) {
      console.error('Failed to save usage log:', error);
    }
  }

  /**
   * Load usage log from localStorage
   */
  private loadUsageLog(): void {
    try {
      const stored = localStorage.getItem('api_usage_log');
      if (stored) {
        this.usageLog = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load usage log:', error);
      this.usageLog = [];
    }
  }
}

// Export singleton instance
export const apiCache = new APICache({
  maxSize: 200,
  defaultDuration: 1000 * 60 * 60 * 24, // 24 hours
});

/**
 * Generate cache key for route requests
 */
export function generateRouteCacheKey(
  waypoints: { lat: number; lng: number }[],
  profile: string = 'driving-car'
): string {
  const coords = waypoints
    .map(w => `${w.lat.toFixed(4)},${w.lng.toFixed(4)}`)
    .join('|');
  return `route:${profile}:${coords}`;
}

/**
 * Generate cache key for geocoding requests
 */
export function generateGeocodeCacheKey(query: string): string {
  return `geocode:${query.toLowerCase().trim()}`;
}
