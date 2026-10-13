/**
 * Routing Service Façade
 *
 * Coordinates geocoding (Nominatim / Kenya hubs) and road routing (OSRM).
 * Provides a clean interface for controllers, estimation services, and MCP tools.
 */

import { OSRMRoutingProvider } from './osrmRoutingProvider.js';
import { geocodeLocation, KNOWN_KENYA_HUBS } from '../geocodingService.js';

// Default active provider instance
let activeRoutingProvider = new OSRMRoutingProvider();

/**
 * Configure or override the active routing provider (e.g. for testing or self-hosted deployment).
 */
export const setRoutingProvider = (provider) => {
  activeRoutingProvider = provider;
};

export const getRoutingProvider = () => {
  return activeRoutingProvider;
};

/**
 * High-level road routing helper.
 *
 * Resolves origins and destinations (whether names or coordinates) and
 * calculates actual road driving distance via OSRM.
 *
 * @param {Object} params
 * @param {string|Object} params.origin
 * @param {string|Object} params.destination
 * @param {Object} [params.options]
 * @returns {Promise<Object>}
 */
export const computeRoadRoute = async ({ origin, destination, options = {} }) => {
  if (!origin || !destination) {
    return {
      success: false,
      code: 'MISSING_ROUTE_PARAMETERS',
      message: 'Both origin and destination are required to calculate a road route.',
    };
  }

  // 1. Support test mocks / offline testing overrides without making external calls
  if (options.mockDistanceKm || process.env.NODE_ENV === 'test' && options.allowTestFallback) {
    const km = options.mockDistanceKm || 20;
    const meters = Math.round(km * 1000);
    return {
      success: true,
      provider: 'mock_test_provider',
      distanceMeters: meters,
      distanceKm: km,
      durationSeconds: Math.round(km * 75),
      polyline: null,
      attribution: 'MavunoTrust Test Fixture',
      originLabel: typeof origin === 'string' ? origin : origin.name || 'Origin',
      destinationLabel: typeof destination === 'string' ? destination : destination.name || 'Destination',
      retrievalTimestamp: new Date(),
      isTestFallback: true,
    };
  }

  // 2. Geocode origin
  const originGeocode = await geocodeLocation(origin);
  if (!originGeocode.success) {
    return {
      success: false,
      code: originGeocode.code || 'ORIGIN_GEOCODING_FAILED',
      message: `Origin location error: ${originGeocode.message}`,
    };
  }

  // 3. Geocode destination
  const destGeocode = await geocodeLocation(destination);
  if (!destGeocode.success) {
    return {
      success: false,
      code: destGeocode.code || 'DESTINATION_GEOCODING_FAILED',
      message: `Destination location error: ${destGeocode.message}`,
    };
  }

  // 4. Compute road route via active RoutingProvider (OSRM)
  const provider = options.providerOverride || activeRoutingProvider;
  const routeResult = await provider.calculateRoute({
    originCoordinates: [originGeocode.lng, originGeocode.lat],
    destinationCoordinates: [destGeocode.lng, destGeocode.lat],
    options,
  });

  if (!routeResult.success) {
    return routeResult;
  }

  const originLabel = typeof origin === 'string' ? origin : origin.name || originGeocode.label;
  const destinationLabel = typeof destination === 'string' ? destination : destination.name || destGeocode.label;

  return {
    ...routeResult,
    originLabel,
    destinationLabel,
    // If coordinates were explicitly supplied, mark as private origin so exact coordinates
    // are not exposed in public listings
    isPrivateOrigin: Boolean(originGeocode.isExactCoordinates || (typeof origin === 'object' && origin.isPrivateOrigin)),
  };
};

// Re-export Kenya hubs dictionary and geocoding helper
export { geocodeLocation, KNOWN_KENYA_HUBS };
