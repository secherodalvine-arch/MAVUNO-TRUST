/**
 * Rating Model
 *
 * Peer review associated with a qualifying completed transaction.
 *
 * IMPORTANT RULES:
 *  1. A rating is NOT official dealer verification.
 *     Ratings reflect user experience — they are separate from AFA licence checks.
 *  2. A rating should only be created when a qualifying transaction exists.
 *     (Full enforcement will be implemented in the authorization layer.)
 *  3. Ratings are visible as part of a dealer's public profile to inform
 *     other farmers — but with a clear disclosure that ratings are NOT
 *     a substitute for official verification.
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRating extends Document {
  transactionId:  Types.ObjectId; // must reference a COMPLETED transaction
  reviewerId:     Types.ObjectId; // ref: User — who is giving the rating
  reviewedUserId: Types.ObjectId; // ref: User — who is being rated
  rating:         number;         // 1–5 scale
  comment?:       string;
  createdAt:      Date;
  updatedAt:      Date;
}

const RatingSchema = new Schema<IRating>(
  {
    transactionId: {
      type:     Schema.Types.ObjectId,
      ref:      'Transaction',
      required: [true, 'Transaction reference is required'],
    },
    reviewerId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Reviewer reference is required'],
    },
    reviewedUserId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Reviewed user reference is required'],
    },
    rating: {
      type:     Number,
      required: [true, 'Rating is required'],
      min:      [1, 'Rating must be at least 1'],
      max:      [5, 'Rating must not exceed 5'],
      validate: {
        validator: (v: number) => Number.isInteger(v),
        message:   'Rating must be a whole number',
      },
    },
    comment: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Comment must not exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// One rating per reviewer per transaction (prevent duplicate ratings)
RatingSchema.index({ transactionId: 1, reviewerId: 1 }, { unique: true });
RatingSchema.index({ reviewedUserId: 1 });

const Rating = mongoose.model<IRating>('Rating', RatingSchema);
export default Rating;
