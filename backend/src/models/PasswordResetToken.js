/**
 * PasswordResetToken Model
 *
 * Architecture for future password-reset flow.
 *
 * SECURITY:
 *   - Only a bcrypt hash of the reset token is stored.
 *   - The raw token is emailed to the user (email integration TBD).
 *   - Tokens are single-use: usedAt is set on first successful use.
 *   - Tokens expire after a short window (e.g. 1 hour).
 *   - On password reset, all active refresh tokens for the user are invalidated.
 *
 * EMAIL NOT YET CONFIGURED:
 *   The endpoint that triggers this model returns a success message but does
 *   NOT actually send email until an email service is integrated.
 *   In development, the token is logged to the server console (never in prod).
 */
import mongoose, { Schema } from 'mongoose';
const PasswordResetTokenSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    tokenHash: {
        type: String,
        required: true,
        select: false,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    usedAt: { type: Date },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetTokenSchema.index({ userId: 1 });
const PasswordResetToken = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
export default PasswordResetToken;
