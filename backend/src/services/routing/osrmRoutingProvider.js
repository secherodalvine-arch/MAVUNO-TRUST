/**
 * OSRM (Open Source Routing Machine) Routing Provider
 *
 * Uses OpenStreetMap road-network data via OSRM's driving profile to compute
 * genuine road distances and transit travel times.
 *
 * SPECIFICATION & USAGE COMPLIANCE:
 * 1. Coordinates strictly formatted as {longitude},{latitude};{longitude},{latitude}.
 * 2. Custom User-Agent header identifying the platform sent on all HTTP calls.
 * 3. In-memory cache for repeated coordinate pairs.
 * 4. Request throttling to respect public demo server guidelines.
 * 5. Conversion of distance in metres to kilometres (metres / 1000).
 * 6. Never invents or silently substitutes distance on routing failure.
 */

import { RoutingProvider } from './routingProvider.js';
import { TRANSPORT_CONFIG } from '../../config/transportConfig.js';

export class OSRMRoutingProvider extends RoutingProvider {
  constructor(config = {}) {
    super('osrm_driving');
    this.baseUrl = config.baseUrl || TRANSPORT_CONFIG.routing.osrmBaseUrl;
    this.userAgent = config.userAgent || TRANSPORT_CONFIG.routing.userAgent;
    this.timeoutMs = config.timeoutMs || TRANSPORT_CONFIG.routing.requestTimeoutMs;
    this.minRequestIntervalMs = config.minRequestIntervalMs || TRANSPORT_CONFIG.routing.minRequestIntervalMs;
    this.cacheTtlMs = config.cacheTtlMs || TRANSPORT_CONFIG.routing.cacheTtlMs;

    this.cache = new Map();
    this.lastRequestTimestamp = 0;
  }

  /**
   * Generates a cache key from coordinate pairs.
   */
  getCacheKey(originCoords, destCoords) {
    const oLng = originCoords[0].toFixed(5);
    const oLat = originCoords[1].toFixed(5);
    const dLng = destCoords[0].toFixed(5);
    const dLat = destCoords[1].toFixed(5);
    return `${oLng},${oLat};${dLng},${dLat}`;
  }

  /**
   * Validates coordinate bounds.
   */
  validateCoordinates(coords, label) {
    if (!Array.isArray(coords) || coords.length < 2) {
      throw new Error(`Invalid ${label} coordinates: Expected [longitude, latitude] array.`);
    }
    const [lng, lat] = coords;
    if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
      throw new Error(`Invalid ${label} coordinates: Coordinates must be numbers.`);
    }
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new Error(`Coordinates out of bounds for ${label}: lng=${lng}, lat=${lat}.`);
    }
  }

  /**
   * Calculate driving route distance and duration using OSRM.
   */
  async calculateRoute({ originCoordinates, destinationCoordinates, options = {} }) {
    this.validateCoordinates(originCoordinates, 'origin');
    this.validateCoordinates(destinationCoordinates, 'destination');

    const [origLng, origLat] = originCoordinates;
    const [destLng, destLat] = destinationCoordinates;

    // 1. Check in-memory route cache
    const cacheKey = this.getCacheKey(originCoordinates, destinationCoordinates);
    if (!options.bypassCache && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey);
      if (Date.now() - entry.timestamp < this.cacheTtlMs) {
        return {
          ...entry.data,
          isFromCache: true,
          retrievalTimestamp: new Date(),
        };
      }
      this.cache.delete(cacheKey);
    }

    // 2. Throttle external requests to prevent flooding upstream demo server
    const now = Date.now();
    const elapsed = now - this.lastRequestTimestamp;
    if (elapsed < this.minRequestIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minRequestIntervalMs - elapsed));
    }
    this.lastRequestTimestamp = Date.now();

    // 3. Format OSRM driving route endpoint:
    // /route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=simplified&steps=false
    const coordinatesPath = `${origLng},${origLat};${destLng},${destLat}`;
    const url = `${this.baseUrl}/route/v1/driving/${coordinatesPath}?overview=simplified&steps=false&annotations=false`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data = null;
      try {
        data = await response.json();
      } catch (_jsonErr) {
        // Body was not JSON
      }

      if (response.status === 429) {
        return {
          success: false,
          code: 'OSRM_RATE_LIMIT_EXCEEDED',
          message: 'OSRM public demo server rate limit reached. Please throttle requests or configure a dedicated instance.',
        };
      }

      // OSRM returns HTTP 400 for NoRoute and invalid segment matching
      if (data && data.code === 'NoRoute') {
        return {
          success: false,
          code: 'NO_ROUTE_FOUND',
          message: 'No road route found between the specified origin and destination on the OpenStreetMap network.',
        };
      }

      if (!response.ok) {
        const errorDetail = data?.message || data?.code || `HTTP ${response.status}`;
        return {
          success: false,
          code: data?.code || `OSRM_HTTP_${response.status}`,
          message: `OSRM routing service returned error: ${errorDetail}`,
        };
      }

      if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
        return {
          success: false,
          code: data.code || 'ROUTING_FAILED',
          message: data.message || 'Routing calculation failed.',
        };
      }

      const primaryRoute = data.routes[0];
      const distanceMeters = Number(primaryRoute.distance);
      const distanceKm = distanceMeters / 1000;
      const durationSeconds = Math.round(Number(primaryRoute.duration || 0));

      const result = {
        success: true,
        provider: 'osrm_driving',
        distanceMeters,
        distanceKm,
        durationSeconds,
        polyline: primaryRoute.geometry || null,
        attribution: '© OpenStreetMap contributors, OSRM',
        originCoordinates: [origLng, origLat],
        destinationCoordinates: [destLng, destLat],
        retrievalTimestamp: new Date(),
      };

      // Store in cache
      this.cache.set(cacheKey, { timestamp: Date.now(), data: result });

      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return {
          success: false,
          code: 'ROUTING_TIMEOUT',
          message: `OSRM request timed out after ${this.timeoutMs}ms`,
        };
      }
      return {
        success: false,
        code: 'ROUTING_NETWORK_ERROR',
        message: `Failed to connect to OSRM routing server: ${err.message}`,
      };
    }
  }
}
