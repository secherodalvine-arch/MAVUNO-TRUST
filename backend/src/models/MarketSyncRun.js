/**
 * MarketSyncRun Model
 *
 * Tracks background execution status, record counts, and errors for MavunoAgent sync jobs.
 */
import mongoose, { Schema } from 'mongoose';

export const SyncStatus = {
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

const MarketSyncRunSchema = new Schema(
  {
    syncRunId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(SyncStatus),
      default: SyncStatus.RUNNING,
      required: true,
    },
    recordsFound: {
      type: Number,
      default: 0,
    },
    recordsSaved: {
      type: Number,
      default: 0,
    },
    recordsRejected: {
      type: Number,
      default: 0,
    },
    errorCode: {
      type: String,
      default: null,
      trim: true,
    },
    errorMessage: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

const MarketSyncRun = mongoose.model('MarketSyncRun', MarketSyncRunSchema);
export default MarketSyncRun;
