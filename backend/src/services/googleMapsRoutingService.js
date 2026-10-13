/**
 * Routing Service Legacy Compatibility Bridge
 *
 * Re-exports routing functionality from the modular OpenStreetMap / OSRM
 * routing provider architecture (src/services/routing).
 *
 * Maintained to ensure seamless backwards compatibility with existing imports.
 */

import { computeRoadRoute } from './routing/index.js';
import { KNOWN_KENYA_HUBS } from './geocodingService.js';

export { computeRoadRoute };

/**
 * Coarsen GPS coordinates for privacy protection (~1.1km radius).
 * Provided for backwards compatibility with legacy tests.
 */
export const sanitizeCoordinatesForPrivacy = (lat, lng) => {
  return {
    latitude: Math.round(lat * 100) / 100,
    longitude: Math.round(lng * 100) / 100,
  };
};

/**
 * Normalizes input origin/destination into a waypoint object.
 */
export const formatWaypoint = (locationInput) => {
  if (!locationInput) {
    throw new Error('Location input cannot be empty');
  }

  if (typeof locationInput === 'object') {
    if (locationInput.lng !== undefined && locationInput.lat !== undefined) {
      return {
        location: { latLng: { latitude: Number(locationInput.lat), longitude: Number(locationInput.lng) } },
        label: `${locationInput.lat}, ${locationInput.lng}`,
      };
    }
    if (locationInput.name || locationInput.address) {
      return { address: locationInput.name || locationInput.address, label: locationInput.name || locationInput.address };
    }
  }

  return { address: String(locationInput), label: String(locationInput) };
};

export const KNOWN_KENYA_CORRIDORS = KNOWN_KENYA_HUBS;
