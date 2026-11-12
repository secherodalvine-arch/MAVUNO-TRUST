/**
 * FarmObservation Model — Historical NDVI Time-Series Storage
 *
 * Stores each Sentinel-2 NDVI observation for a farmer's registered farm.
 * Enables:
 *  - Historical vegetation health trend tracking
 *  - Time-series comparison charts on the dashboard
 *  - Long-term farm health monitoring
 *
 * PRIVACY DESIGN:
 *  - Linked to userId only (not publicly queryable)
 *  - No raw farm boundary coordinates stored here
 *  - Observation values and metadata only
 */

import mongoose, { Schema } from 'mongoose';

const FarmObservationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for farm observation'],
      index: true,
    },
    // Date of the Sentinel-2 imagery observation
    observationDate: {
      type: Date,
      required: [true, 'Observation date is required'],
    },
    // NDVI Metrics
    meanNDVI: {
      type: Number,
      min: [-1, 'NDVI cannot be below -1'],
      max: [1, 'NDVI cannot exceed 1'],
    },
    minNDVI: {
      type: Number,
      min: [-1, 'NDVI cannot be below -1'],
      max: [1, 'NDVI cannot exceed 1'],
    },
    maxNDVI: {
      type: Number,
      min: [-1, 'NDVI cannot be below -1'],
      max: [1, 'NDVI cannot exceed 1'],
    },
    // Vegetation health classification at time of observation
    vegetationLabel: {
      type: String,
      trim: true,
    },
    vegetationSeverity: {
      type: String,
      enum: ['good', 'moderate', 'concern', 'unknown'],
      default: 'unknown',
    },
    // Satellite observation quality
    cloudCoverPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    validPixelPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    // Farm metadata at time of observation
    farmAreaAcres: {
      type: Number,
      min: 0,
    },
    // Sentinel-2 dataset reference
    dataset: {
      type: String,
      default: 'COPERNICUS/S2_SR_HARMONIZED',
    },
    // Source of the observation (live GEE, Copernicus STAC, Sentinel Hub, or simulated)
    source: {
      type: String,
      enum: ['GEE_LIVE', 'GEE_SENTINEL2', 'COPERNICUS_STAC', 'SENTINEL_HUB', 'LIVE', 'MANUAL', 'SIMULATED'],
      default: 'GEE_LIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient per-user time-series queries
FarmObservationSchema.index({ userId: 1, observationDate: -1 });
// Index for dashboard trend queries within a date range
FarmObservationSchema.index({ userId: 1, createdAt: -1 });

const FarmObservation = mongoose.model('FarmObservation', FarmObservationSchema);
export default FarmObservation;
