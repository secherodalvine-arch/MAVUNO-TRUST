/**
 * FarmWeatherCache Model — Persistent Weather Cache
 *
 * Caches weather observations in MongoDB to prevent hitting upstream
 * API rate limits (e.g. Open-Meteo HTTP 429 when deployed on shared cloud IPs like Render).
 *
 * Indexed by geographic grid key (approx 10km resolution) with TTL expiration.
 */

import mongoose, { Schema } from 'mongoose';

const FarmWeatherCacheSchema = new Schema(
  {
    gridKey: {
      type: String,
      required: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    weatherData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    source: {
      type: String,
      default: 'OPEN_METEO',
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

FarmWeatherCacheSchema.index({ gridKey: 1, fetchedAt: -1 });

export default mongoose.models.FarmWeatherCache ||
  mongoose.model('FarmWeatherCache', FarmWeatherCacheSchema);

