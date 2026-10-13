/**
 * Transport Subsystem Configuration
 *
 * Configurable settings for OpenStreetMap/OSRM routing, Nominatim geocoding,
 * data quality fences, and transport-cost estimation assumptions.
 *
 * NOTE: Economic parameters (minimum fares, rate bounds) represent provisional
 * baselines for Kenya transit corridors and can be overridden via environment
 * variables as empirical market surveys are conducted.
 */

import dotenv from 'dotenv';
dotenv.config();

export const TRANSPORT_CONFIG = {
  // ── OpenStreetMap & OSRM Routing ──
  routing: {
    // OSRM base URL (default: public demo server; configure private instance for production)
    osrmBaseUrl: (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/+$/, ''),
    // HTTP User-Agent identifying the application per OSM usage policies
    userAgent: process.env.OSRM_USER_AGENT || 'MavunoTrust-Transport/1.0 (https://mavunotrust.co.ke; transport@mavunotrust.co.ke)',
    requestTimeoutMs: Number(process.env.OSRM_TIMEOUT_MS) || 8000,
    // Rate limit throttle for public server (ms between consecutive external calls)
    minRequestIntervalMs: Number(process.env.OSRM_THROTTLE_MS) || 200,
    cacheTtlMs: Number(process.env.OSRM_CACHE_TTL_MS) || 1000 * 60 * 30, // 30 mins cache
  },

  // ── Nominatim Geocoding ──
  geocoding: {
    nominatimBaseUrl: (process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org').replace(/\/+$/, ''),
    userAgent: process.env.NOMINATIM_USER_AGENT || 'MavunoTrust-Geocoding/1.0 (contact@mavunotrust.co.ke)',
    countryCode: 'ke',
    // Strict 1 request per second per Nominatim Usage Policy
    minRequestIntervalMs: Number(process.env.NOMINATIM_THROTTLE_MS) || 1100,
    requestTimeoutMs: Number(process.env.NOMINATIM_TIMEOUT_MS) || 8000,
    cacheTtlMs: 1000 * 60 * 60 * 24, // 24 hours cache for locations
  },

  // ── Quality & Anti-Manipulation Fences ──
  quality: {
    minPlausibleRatePerKm: Number(process.env.MIN_PLAUSIBLE_RATE_PER_KM) || 5, // KSh/km
    maxPlausibleRatePerKm: Number(process.env.MAX_PLAUSIBLE_RATE_PER_KM) || 1500, // KSh/km
    maxRecordsPerContributor: Number(process.env.MAX_RECORDS_PER_CONTRIBUTOR) || 2,
    newAccountAgeDays: Number(process.env.NEW_ACCOUNT_AGE_DAYS) || 7,
    clusterWindowHours: Number(process.env.CLUSTER_WINDOW_HOURS) || 48,
    iqrMultiplier: 2.5,
  },

  // ── Provisional Baseline Pricing Assumptions ──
  // Clearly labeled as provisional defaults when no empirical corridor records exist
  provisionalBaselines: {
    vehicleBaseCharges: {
      PICKUP: Number(process.env.BASE_CHARGE_PICKUP) || 1200,
      SMALL_TRUCK: Number(process.env.BASE_CHARGE_SMALL_TRUCK) || 3000,
      MEDIUM_LORRY: Number(process.env.BASE_CHARGE_MEDIUM_LORRY) || 6000,
      LARGE_LORRY: Number(process.env.BASE_CHARGE_LARGE_LORRY) || 12000,
      OTHER: Number(process.env.BASE_CHARGE_OTHER) || 3500,
    },
    defaultRatesPerKm: {
      PICKUP: Number(process.env.DEFAULT_RATE_PICKUP) || 65,
      SMALL_TRUCK: Number(process.env.DEFAULT_RATE_SMALL_TRUCK) || 110,
      MEDIUM_LORRY: Number(process.env.DEFAULT_RATE_MEDIUM_LORRY) || 175,
      LARGE_LORRY: Number(process.env.DEFAULT_RATE_LARGE_LORRY) || 280,
      OTHER: Number(process.env.DEFAULT_RATE_OTHER) || 120,
    },
    // Provisional multiplier applied only if zero comparable shared records exist
    sharedLoadProvisionalFactor: 0.65, // ~35% discount
    // Provisional payload surcharge applied only for heavy loads over 3 tonnes if zero comparable heavy records exist
    heavyLoadProvisionalFactor: 1.10, // ~10% surcharge
  },
};
