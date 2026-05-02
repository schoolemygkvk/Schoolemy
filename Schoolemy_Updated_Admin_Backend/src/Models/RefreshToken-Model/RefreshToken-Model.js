import { Schema, model } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    // Reference to the user — can point to either 'Admin-data-login' or 'Tutor' collection
    userRef: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "userModel",
    },
    userModel: {
      type: String,
      required: true,
      enum: ["Admin-data-login", "Tutor"],
    },
    // SHA-256 hash of the refresh token (for fast O(1) lookup instead of bcrypt loop)
    tokenHash: {
      type: String,
    },
    // Keep original bcrypt token field for backwards compatibility during migration
    // TODO: Remove after migration period
    token: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    // Audit fields
    ipAddress: { type: String },
    userAgent: { type: String },
    rotatedAt: { type: Date }, // set when this token is consumed and replaced
    revokedAt: { type: Date }, // set when explicitly revoked (logout)
  },
  { timestamps: true }
);

// MongoDB TTL index — document auto-deleted 0 seconds after expiresAt
// This is the background cleanup mechanism; isRevoked handles early invalidation
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for fast lookup by userRef during logout (revoking all tokens for a user)
refreshTokenSchema.index({ userRef: 1, isRevoked: 1 });

// Index for O(1) token lookup during refresh (unique + sparse allows null for old tokens)
refreshTokenSchema.index({ tokenHash: 1 }, { unique: true, sparse: true });

const RefreshToken = model("RefreshToken", refreshTokenSchema);
export default RefreshToken;
