/**
 * User Model
 * Core identity document for all MavunoTrust platform users.
 *
 * Supports three roles: FARMER, DEALER, ADMIN.
 * Passwords are NEVER stored in plaintext — only bcrypt hashes.
 * Linked to role-specific profile models (FarmerProfile, DealerProfile).
 */

import mongoose, { Document, Schema } from 'mongoose';

// ── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  FARMER = 'FARMER',
  DEALER = 'DEALER',
  ADMIN  = 'ADMIN',
}

export enum AccountStatus {
  ACTIVE    = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

// ── Interface ────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  fullName:         string;
  email:            string;
  phoneNumber?:     string;
  passwordHash:     string;
  role:             UserRole;
  accountStatus:    AccountStatus;
  lastLoginAt?:     Date;
  privacyAcknowledgedAt?: Date;
  createdAt:        Date;
  updatedAt:        Date;
}

// ── Schema ───────────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type:     String,
      required: [true, 'Full name is required'],
      trim:     true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name must not exceed 100 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phoneNumber: {
      type:  String,
      trim:  true,
      match: [/^\+?[\d\s\-().]{7,20}$/, 'Please provide a valid phone number'],
    },
    passwordHash: {
      type:     String,
      required: [true, 'Password is required'],
      // Never return password hash in queries
      select:   false,
    },
    role: {
      type:     String,
      enum:     {
        values:  Object.values(UserRole),
        message: 'Role must be one of: FARMER, DEALER, ADMIN',
      },
      required: [true, 'Role is required'],
    },
    accountStatus: {
      type:    String,
      enum:    Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
    },
    lastLoginAt: {
      type: Date,
    },
    // Records when user acknowledged the platform privacy notice.
    // Required for consent tracking (see UserConsent model).
    privacyAcknowledgedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // auto-manages createdAt, updatedAt
    toJSON: {
      transform: (_doc, ret) => {
        // Never expose passwordHash via toJSON (defence in depth)
        delete (ret as any).passwordHash;
        return ret;
      },
    },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

UserSchema.index({ role: 1 });          // role-based queries
UserSchema.index({ accountStatus: 1 }); // admin filtering

// ── Model ────────────────────────────────────────────────────────────────────

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
