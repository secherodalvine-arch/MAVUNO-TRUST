/**
 * RefreshToken Model
 *
 * Stores hashed refresh tokens so that:
 *   1. Tokens can be individually invalidated on logout.
 *   2. All tokens for a user can be invalidated on password change /
 *      account suspension.
 *   3. The raw token is NEVER stored — only a bcrypt hash.
 *
 * Security notes:
 *   - expiresAt enables TTL cleanup (can be added as a MongoDB TTL index).
 *   - revokedAt marks tokens that have been explicitly invalidated.
 *   - issuedForIp is stored for anomaly detection (optional future use).
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  userId:        Types.ObjectId;
  tokenHash:     string;      // bcrypt hash of the raw token — NEVER the token itself
  expiresAt:     Date;
  revokedAt?:    Date;
  issuedForIp?:  string;
  createdAt:     Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    tokenHash: {
      type:     String,
      required: true,
      select:   false, // never returned from queries unless explicitly requested
    },
    expiresAt: {
      type:     Date,
      required: true,
    },
    revokedAt: { type: Date },
    issuedForIp: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index — MongoDB will auto-remove expired documents
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1 });

const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
export default RefreshToken;
