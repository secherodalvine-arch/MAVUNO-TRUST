/**
 * Geocoding Service (OpenStreetMap Nominatim + Kenyan Agricultural Hubs Dictionary)
 *
 * Resolves Kenyan place names to coordinates [longitude, latitude] for OSRM routing.
 *
 * NOMINATIM POLICY COMPLIANCE:
 * 1. Specific HTTP User-Agent header is sent with all requests.
 * 2. Rate-limited with a minimum 1.1s throttle between outbound requests.
 * 3. In-memory caching prevents duplicate queries.
 * 4. Pre-populated dictionary for common Kenyan agricultural markets eliminates
 *    unnecessary public API traffic.
 */

import { TRANSPORT_CONFIG } from '../config/transportConfig.js';

// Pre-cached coordinates for major Kenyan agricultural trading hubs and wholesale markets
// Coordinates stored as [longitude, latitude]
export const KNOWN_KENYA_HUBS = {
  'eldoret': { lng: 35.2698, lat: 0.5143, label: 'Eldoret, Uasin Gishu' },
  'kitale': { lng: 35.0062, lat: 1.0167, label: 'Kitale, Trans Nzoia' },
  'nakuru': { lng: 36.0663, lat: -0.2833, label: 'Nakuru Town' },
  'nairobi': { lng: 36.8315, lat: -1.2858, label: 'Nairobi - Wakulima Market' },
  'wakulima': { lng: 36.8315, lat: -1.2858, label: 'Nairobi - Wakulima Market' },
  'mombasa': { lng: 39.6845, lat: -4.0435, label: 'Mombasa - Kongowea Market' },
  'kongowea': { lng: 39.6845, lat: -4.0435, label: 'Mombasa - Kongowea Market' },
  'kisumu': { lng: 34.7617, lat: -0.0917, label: 'Kisumu - Kibuye Market' },
  'kibuye': { lng: 34.7617, lat: -0.0917, label: 'Kisumu - Kibuye Market' },
  'nyeri': { lng: 36.9476, lat: -0.4201, label: 'Nyeri Town' },
  'meru': { lng: 37.6559, lat: 0.0463, label: 'Meru Town' },
  'machakos': { lng: 37.2634, lat: -1.5177, label: 'Machakos Market' },
  'naivasha': { lng: 36.4359, lat: -0.7172, label: 'Naivasha Town' },
  'thika': { lng: 37.0693, lat: -1.0332, label: 'Thika Wholesale' },
  'narok': { lng: 35.8710, lat: -1.0783, label: 'Narok Town' },
  'kericho': { lng: 35.2863, lat: -0.3689, label: 'Kericho Town' },
  'embu': { lng: 37.4589, lat: -0.5344, label: 'Embu Town' },
  'kakamega': { lng: 34.7523, lat: 0.2827, label: 'Kakamega Town' },
  'bungoma': { lng: 34.5606, lat: 0.5695, label: 'Bungoma Town' },
  'kisii': { lng: 34.7796, lat: -0.6817, label: 'Kisii Town' },
  'garissa': { lng: 39.6461, lat: -0.4532, label: 'Garissa Town' },
  'kiambu': { lng: 36.8304, lat: -1.1714, label: 'Kiambu Town' },
};

// In-memory cache for geocoded queries
const geocodeCache = new Map();

// Throttle queue timestamp for Nominatim 1 req/sec policy
let lastNominatimRequestTime = 0;

/**
 * Normalizes query string for dictionary lookup
 */
const normalizeQuery = (text) => {
  return (text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Resolves coordinates for a location string or coordinate object.
 *
 * @param {string|Object} locationInput
 * @returns {Promise<{ success: boolean, lng: number, lat: number, label: string, isFromCache?: boolean }>}
 */
export const geocodeLocation = async (locationInput) => {
  if (!locationInput) {
    return { success: false, code: 'EMPTY_LOCATION', message: 'Location cannot be empty' };
  }

  // 1. Direct coordinate object or array
  if (typeof locationInput === 'object') {
    let lat = null;
    let lng = null;

    if (locationInput.lng !== undefined && locationInput.lat !== undefined) {
      lng = Number(locationInput.lng);
      lat = Number(locationInput.lat);
    } else if (locationInput.longitude !== undefined && locationInput.latitude !== undefined) {
      lng = Number(locationInput.longitude);
      lat = Number(locationInput.latitude);
    } else if (Array.isArray(locationInput) && locationInput.length >= 2) {
      // GeoJSON [longitude, latitude]
      lng = Number(locationInput[0]);
      lat = Number(locationInput[1]);
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      // Validate latitude and longitude bounds
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return { success: false, code: 'INVALID_COORDINATES', message: 'Coordinates out of geographical bounds' };
      }
      return {
        success: true,
        lng,
        lat,
        label: locationInput.name || locationInput.label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        isExactCoordinates: true,
      };
    }

    if (locationInput.name || locationInput.address) {
      locationInput = locationInput.name || locationInput.address;
    }
  }

  const queryText = String(locationInput).trim();
  if (!queryText) {
    return { success: false, code: 'EMPTY_LOCATION', message: 'Location text cannot be empty' };
  }

  // 2. Check local Kenya Agricultural Hubs dictionary
  const normalized = normalizeQuery(queryText);
  for (const [key, hub] of Object.entries(KNOWN_KENYA_HUBS)) {
    if (normalized.includes(key)) {
      return {
        success: true,
        lng: hub.lng,
        lat: hub.lat,
        label: hub.label,
        source: 'kenya_hubs_dictionary',
      };
    }
  }

  // 3. Check in-memory LRU cache
  if (geocodeCache.has(normalized)) {
    const cached = geocodeCache.get(normalized);
    return { ...cached, isFromCache: true };
  }

  // 4. Query OpenStreetMap Nominatim with strict rate-limiting
  const { nominatimBaseUrl, userAgent, countryCode, minRequestIntervalMs, requestTimeoutMs } =
    TRANSPORT_CONFIG.geocoding;

  // Rate-limiting throttle (ensure >= minRequestIntervalMs elapsed)
  const now = Date.now();
  const timeSinceLast = now - lastNominatimRequestTime;
  if (timeSinceLast < minRequestIntervalMs) {
    await new Promise((r) => setTimeout(r, minRequestIntervalMs - timeSinceLast));
  }
  lastNominatimRequestTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const url = new URL(`${nominatimBaseUrl}/search`);
    url.searchParams.set('q', queryText);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', countryCode);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        code: `NOMINATIM_HTTP_${response.status}`,
        message: `Geocoding service returned status ${response.status}`,
      };
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      return {
        success: false,
        code: 'GEOCODING_NOT_FOUND',
        message: `Could not geocode location "${queryText}" in Kenya. Please select a recognized trading centre or market town.`,
      };
    }

    const first = results[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);

    if (isNaN(lat) || isNaN(lng)) {
      return {
        success: false,
        code: 'INVALID_GEOCODE_RESPONSE',
        message: 'Geocoding service returned invalid coordinates',
      };
    }

    const result = {
      success: true,
      lng,
      lat,
      label: first.display_name?.split(',')[0] || queryText,
      source: 'osm_nominatim',
    };

    geocodeCache.set(normalized, result);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, code: 'GEOCODING_TIMEOUT', message: 'Geocoding request timed out' };
    }
    return {
      success: false,
      code: 'GEOCODING_NETWORK_ERROR',
      message: `Failed to contact geocoding service: ${err.message}`,
    };
  }
};
