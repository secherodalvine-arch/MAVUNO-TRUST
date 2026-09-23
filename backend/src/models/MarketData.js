/**
 * MarketData Model
 *
 * Dedicated collection for market price observations retrieved directly by MavunoAgent.
 */
import mongoose, { Schema } from 'mongoose';

const MarketDataSchema = new Schema(
  {
    source: {
      type: String,
      default: 'MAVUNOAGENT',
      required: true,
    },
    sourceMethod: {
      type: String,
      default: 'MAVUNO_AGENT',
      required: true,
    },
    commodity: {
      type: String,
      required: [true, 'Commodity name is required'],
      trim: true,
    },
    classification: {
      type: String,
      trim: true,
      default: null,
    },
    grade: {
      type: String,
      trim: true,
      default: null,
    },
    market: {
      type: String,
      required: [true, 'Market location is required'],
      trim: true,
    },
    county: {
      type: String,
      trim: true,
      default: null,
    },
    wholesalePrice: {
      type: Number,
      default: null,
      min: [0, 'Wholesale price cannot be negative'],
    },
    retailPrice: {
      type: Number,
      default: null,
      min: [0, 'Retail price cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      trim: true,
    },
    supplyVolume: {
      type: Number,
      default: null,
      min: [0, 'Supply volume cannot be negative'],
    },
    observedDate: {
      type: Date,
      required: [true, 'Observation date is required'],
    },
    retrievedAt: {
      type: Date,
      default: Date.now,
    },
    sourceUrl: {
      type: String,
      default: 'https://kamis.kilimo.go.ke',
      trim: true,
    },
    syncRunId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

MarketDataSchema.index({ commodity: 1, market: 1, observedDate: -1 });
MarketDataSchema.index({ syncRunId: 1 });
MarketDataSchema.index({ source: 1, observedDate: -1 });

const MarketData = mongoose.model('MarketData', MarketDataSchema);
export default MarketData;
