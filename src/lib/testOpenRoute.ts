/**
 * OpenRouteService Testing Utility
 *
 * Test ORS API integration from browser console
 *
 * Usage:
 *   await testORS.runAllTests()
 *   testORS.checkUsage()
 *   await testORS.testDirections()
 */

import { openRouteService } from '@/services/openRouteService';
import { routeService } from '@/services/routeService';
import { apiCache } from '@/lib/apiCache';
import { getUserMembership, isFeatureEnabled } from '@/lib/featureFlags';

/**
 * Test Directions API
 */
export async function testDirections() {
  console.group('🗺️ Testing OpenRouteService Directions API');

  try {
    console.log('Testing route: San Francisco → Los Angeles');

    const waypoints = [
      { lat: 37.7749, lng: -122.4194 }, // San Francisco
      { lat: 34.0522, lng: -118.2437 }  // Los Angeles
    ];

    console.time('API Call');
    const route = await openRouteService.getDirections(waypoints, 'driving-car', {
      includeInstructions: true,
      includeGeometry: true,
    });
    console.timeEnd('API Call');

    if (route) {
      console.log('✅ Success!');
      console.log('Distance:', (route.summary.distance / 1000).toFixed(2), 'km');
      console.log('Duration:', (route.summary.duration / 3600).toFixed(2), 'hours');
      console.log('Geometry points:', route.geometry?.coordinates?.length || 0);
      console.log('Turn-by-turn steps:', route.segments?.flatMap(s => s.steps)?.length || 0);
      console.log('Full route data:', route);
    } else {
      console.warn('⚠️ No route returned (check API key, rate limit, or network)');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Test Geocoding API
 */
export async function testGeocode() {
  console.group('📍 Testing OpenRouteService Geocoding API');

  try {
    const addresses = [
      'San Francisco, CA',
      'Los Angeles, CA',
      'New York, NY'
    ];

    for (const address of addresses) {
      console.log(`\nGeocoding: "${address}"`);
      console.time(`Geocode ${address}`);

      const result = await openRouteService.geocode(address, { country: 'US' });

      console.timeEnd(`Geocode ${address}`);

      if (result) {
        console.log('✅ Success!');
        console.log('Coordinates:', result.lat.toFixed(4), result.lng.toFixed(4));
        console.log('Label:', result.label);
      } else {
        console.warn('⚠️ No result returned');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Test Caching System
 */
export async function testCache() {
  console.group('💾 Testing API Cache');

  try {
    const waypoints = [
      { lat: 37.7749, lng: -122.4194 },
      { lat: 34.0522, lng: -118.2437 }
    ];

    console.log('First call (should hit API):');
    console.time('First Call');
    await openRouteService.getDirections(waypoints, 'driving-car');
    console.timeEnd('First Call');

    console.log('\nSecond call (should be cached):');
    console.time('Second Call (Cached)');
    await openRouteService.getDirections(waypoints, 'driving-car');
    console.timeEnd('Second Call (Cached)');

    console.log('\n✅ Check the timing difference above!');
    console.log('Cached call should be <10ms, API call ~500-2000ms');

    // Show cache stats
    const stats = apiCache.getStats();
    console.log('\nCache Statistics:');
    console.log('Size:', stats.size, '/', stats.maxSize);
    console.log('Usage:', stats.usage);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Test Route Service Integration
 */
export async function testRouteService() {
  console.group('🛣️ Testing Route Service Integration');

  try {
    const waypoints = [
      { lat: 37.7749, lng: -122.4194 }, // SF
      { lat: 36.7783, lng: -119.4179 }, // Fresno
      { lat: 34.0522, lng: -118.2437 }  // LA
    ];

    console.log('Testing route calculation with 3 waypoints');
    console.log('User: test@example.com (should have API access)');

    console.time('Route Calculation');
    const result = await routeService.calculateRoute(waypoints, 'test@example.com');
    console.timeEnd('Route Calculation');

    console.log('✅ Success!');
    console.log('Distance:', result.distance.toFixed(2), 'km');
    console.log('Duration:', result.duration.toFixed(2), 'hours');
    console.log('Has geometry:', !!result.geometry);
    console.log('Has instructions:', !!result.instructions);
    console.log('Full result:', result);

    // Test fallback with non-premium user
    console.log('\n\nTesting fallback for free user:');
    console.time('Mock Calculation');
    const mockResult = await routeService.calculateRoute(waypoints, 'free@example.com');
    console.timeEnd('Mock Calculation');

    console.log('✅ Fallback works!');
    console.log('Distance (mock):', mockResult.distance.toFixed(2), 'km');
    console.log('Duration (mock):', mockResult.duration.toFixed(2), 'hours');
    console.log('Has geometry:', !!mockResult.geometry, '(should be false for mock)');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Test Geocoding Integration
 */
export async function testGeocodeService() {
  console.group('🌍 Testing Geocoding Integration');

  try {
    const addresses = ['San Francisco, CA', 'Seattle, WA'];

    for (const address of addresses) {
      console.log(`\nGeocoding: "${address}"`);

      const result = await routeService.geocodeAddress(address, 'test@example.com');

      if (result) {
        console.log('✅ Success!');
        console.log('Coordinates:', result);
      } else {
        console.warn('⚠️ No result (might be fallback behavior)');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Check API Usage Statistics
 */
export function checkUsage() {
  console.group('📊 API Usage Statistics');

  const usage = apiCache.getTodayUsage();
  const remaining = openRouteService.getRemainingQuota();

  console.log('Today\'s Usage:');
  console.log('Total requests:', usage.total);
  console.log('API calls:', usage.apiCalls, '/ 2000 (free tier)');
  console.log('Cached requests:', usage.cached);
  console.log('Cache hit rate:', ((usage.cached / usage.total * 100) || 0).toFixed(1) + '%');
  console.log('Remaining quota:', remaining);

  console.log('\nBreakdown by endpoint:');
  Object.entries(usage.byEndpoint).forEach(([endpoint, count]) => {
    console.log(`  ${endpoint}:`, count);
  });

  // Cache stats
  const cacheStats = apiCache.getStats();
  console.log('\nCache Statistics:');
  console.log('Size:', cacheStats.size, '/', cacheStats.maxSize);
  console.log('Usage:', cacheStats.usage);

  // Feature flags
  console.log('\nFeature Flags:');
  console.log('test@example.com tier:', getUserMembership('test@example.com'));
  console.log('Has realTimeRouting:', isFeatureEnabled('realTimeRouting', 'test@example.com'));
  console.log('Has geocoding:', isFeatureEnabled('geocoding', 'test@example.com'));

  console.groupEnd();
}

/**
 * Test API Configuration
 */
export function checkConfig() {
  console.group('⚙️ API Configuration');

  const apiKey = import.meta.env.VITE_OPENROUTE_API_KEY;

  console.log('API Key configured:', !!apiKey);
  console.log('API Key preview:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT SET');
  console.log('ORS service configured:', openRouteService.isConfigured());

  console.groupEnd();
}

/**
 * Clear Cache (for testing)
 */
export function clearCache() {
  console.log('🗑️ Clearing API cache...');
  apiCache.clear();
  console.log('✅ Cache cleared!');
}

/**
 * Run All Tests
 */
export async function runAllTests() {
  console.clear();
  console.log('🚀 Running OpenRouteService Integration Tests\n');

  // Check config first
  checkConfig();

  // Run tests sequentially
  await testDirections();
  await testGeocode();
  await testCache();
  await testRouteService();
  await testGeocodeService();

  // Show final usage stats
  checkUsage();

  console.log('\n✅ All tests complete!');
  console.log('\nNext steps:');
  console.log('1. Restart dev server to load new API key');
  console.log('2. Check for any errors above');
  console.log('3. Verify cache hit rate is >50%');
  console.log('4. Update RoutePlanner component with real routing');
}

// Expose to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).testORS = {
    testDirections,
    testGeocode,
    testCache,
    testRouteService,
    testGeocodeService,
    checkUsage,
    checkConfig,
    clearCache,
    runAllTests,
  };

  console.log('🧪 ORS Test Utility loaded!');
  console.log('Run tests: await testORS.runAllTests()');
  console.log('Check usage: testORS.checkUsage()');
  console.log('Available methods:', Object.keys((window as any).testORS));
}
