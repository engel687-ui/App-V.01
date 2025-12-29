/**
 * OpenRouteService API Integration
 *
 * Provides real routing, geocoding, and optimization
 * Free tier: 2,000 requests/day
 *
 * API Documentation: https://openrouteservice.org/dev/#/api-docs
 */

import type {
  ORSDirectionsRequest,
  ORSDirectionsResponse,
  ORSGeocodeRequest,
  ORSGeocodeResponse,
  ORSRoute,
} from '@/types';
import {
  apiCache,
  generateRouteCacheKey,
  generateGeocodeCacheKey,
} from '@/lib/apiCache';

class OpenRouteService {
  private apiKey: string;
  private baseUrl = 'https://api.openrouteservice.org';
  private directionsEndpoint = '/v2/directions';
  private geocodeEndpoint = '/geocode/search';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTE_API_KEY || '';
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get route directions between waypoints
   *
   * @example
   * const route = await ors.getDirections([
   *   { lat: 37.7749, lng: -122.4194 }, // San Francisco
   *   { lat: 34.0522, lng: -118.2437 }  // Los Angeles
   * ]);
   */
  async getDirections(
    waypoints: { lat: number; lng: number }[],
    profile: 'driving-car' | 'driving-hgv' = 'driving-car',
    options: {
      includeInstructions?: boolean;
      includeGeometry?: boolean;
      includeElevation?: boolean;
    } = {}
  ): Promise<ORSRoute | null> {
    // Check configuration
    if (!this.isConfigured()) {
      console.warn('OpenRouteService API key not configured');
      return null;
    }

    // Check cache
    const cacheKey = generateRouteCacheKey(waypoints, profile);
    const cached = apiCache.get<ORSRoute>(cacheKey);
    if (cached) {
      apiCache.logUsage('directions', true, true);
      return cached;
    }

    // Check rate limit
    if (!apiCache.isWithinRateLimit()) {
      console.warn('OpenRouteService rate limit reached for today');
      return null;
    }

    try {
      // ORS uses [lng, lat] format (reversed from our internal format!)
      const coordinates: [number, number][] = waypoints.map(w => [w.lng, w.lat]);

      const requestBody: ORSDirectionsRequest = {
        coordinates,
        profile,
        units: 'km',
        language: 'en',
        geometry: options.includeGeometry !== false,
        instructions: options.includeInstructions !== false,
        elevation: options.includeElevation || false,
        extra_info: options.includeElevation ? ['surface'] : undefined,
      };

      const response = await fetch(
        `${this.baseUrl}${this.directionsEndpoint}/${profile}`,
        {
          method: 'POST',
          headers: {
            Authorization: this.apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      // Handle errors
      if (response.status === 401) {
        console.error('OpenRouteService: Invalid API key');
        apiCache.logUsage('directions', false, false);
        return null;
      }

      if (response.status === 429) {
        console.warn('OpenRouteService: Rate limit exceeded');
        apiCache.logUsage('directions', false, false);
        return null;
      }

      if (!response.ok) {
        throw new Error(`ORS API error: ${response.statusText}`);
      }

      const data: ORSDirectionsResponse = await response.json();

      if (!data.routes || data.routes.length === 0) {
        console.warn('OpenRouteService: No routes found');
        apiCache.logUsage('directions', false, false);
        return null;
      }

      const route = data.routes[0];

      // Cache result for 24 hours (routes don't change frequently)
      apiCache.set(cacheKey, route, 1000 * 60 * 60 * 24);
      apiCache.logUsage('directions', true, false);

      return route;
    } catch (error) {
      console.error('OpenRouteService directions error:', error);
      apiCache.logUsage('directions', false, false);
      return null;
    }
  }

  /**
   * Geocode address to coordinates
   *
   * @example
   * const coords = await ors.geocode('San Francisco, CA');
   * // Returns: { lat: 37.7749, lng: -122.4194, label: 'San Francisco, CA, USA' }
   */
  async geocode(
    query: string,
    options: {
      country?: string;
      limit?: number;
    } = {}
  ): Promise<{ lat: number; lng: number; label: string } | null> {
    if (!this.isConfigured()) {
      console.warn('OpenRouteService API key not configured');
      return null;
    }

    // Check cache
    const cacheKey = generateGeocodeCacheKey(query);
    const cached = apiCache.get<{ lat: number; lng: number; label: string }>(
      cacheKey
    );
    if (cached) {
      apiCache.logUsage('geocode', true, true);
      return cached;
    }

    // Check rate limit
    if (!apiCache.isWithinRateLimit()) {
      console.warn('OpenRouteService rate limit reached');
      return null;
    }

    try {
      const params = new URLSearchParams({
        text: query,
        size: (options.limit || 1).toString(),
      });

      if (options.country) {
        params.append('boundary.country', options.country);
      }

      const response = await fetch(
        `${this.baseUrl}${this.geocodeEndpoint}?${params}`,
        {
          headers: {
            Authorization: this.apiKey,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`ORS Geocode error: ${response.statusText}`);
      }

      const data: ORSGeocodeResponse = await response.json();

      if (!data.features || data.features.length === 0) {
        apiCache.logUsage('geocode', false, false);
        return null;
      }

      const feature = data.features[0];
      const [lng, lat] = feature.geometry.coordinates;

      const result = {
        lat,
        lng,
        label: feature.properties.label,
      };

      // Cache for 30 days (locations don't change)
      apiCache.set(cacheKey, result, 1000 * 60 * 60 * 24 * 30);
      apiCache.logUsage('geocode', true, false);

      return result;
    } catch (error) {
      console.error('OpenRouteService geocode error:', error);
      apiCache.logUsage('geocode', false, false);
      return null;
    }
  }

  /**
   * Get API usage statistics
   */
  getUsageStats() {
    return apiCache.getTodayUsage();
  }

  /**
   * Get remaining quota
   */
  getRemainingQuota(dailyLimit: number = 2000): number {
    const stats = apiCache.getTodayUsage();
    return Math.max(0, dailyLimit - stats.apiCalls);
  }
}

// Export singleton instance
export const openRouteService = new OpenRouteService();
