import mongoose, { Schema, model } from "mongoose";



const refreshTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // Token is stored hashed in DB for security
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      // TTL index: MongoDB automatically deletes expired tokens
      // Creates TTL index: db.refreshtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
      // Revoked tokens cannot be used even if not expired
      // Used when user logs out or password changes
    },
    ipAddress: {
      type: String,
      default: null,
      // Track which IP/device issued the token
      // Used for security: if token used from different IP, may indicate compromise
    },
    userAgent: {
      type: String,
      default: null,
      // Track device/browser information
      // Used to detect if token used on different device
    },
    rotatedAt: {
      type: Date,
      default: null,
      // When this token was rotated (replaced with new token)
      // null = not yet rotated
    },
    revokedAt: {
      type: Date,
      default: null,
      // When this token was revoked (invalidated)
      // null = not revoked
    },
  },
  {
    timestamps: true,
    // createdAt: When token was issued
    // updatedAt: When token was last modified
  },
);

// SECURITY FIX 3.32.2: TTL Index for automatic token cleanup
// MongoDB automatically deletes tokens after they expire
// This prevents database from growing indefinitely
// Index is created on 'expiresAt' field with expireAfterSeconds: 0
// (0 means delete immediately when expiration time passes)
refreshTokenSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: "refreshTokenTTL",
  },
);

// SECURITY FIX 3.32.3: Compound index for efficient queries
// When checking if token is valid: find by token + not revoked
refreshTokenSchema.index(
  { token: 1, isRevoked: 1 },
  { name: "tokenValidityIndex" },
);

// SECURITY FIX 3.32.4: User-based queries for logout
// When user logs out, revoke all their refresh tokens
refreshTokenSchema.index(
  { user: 1, isRevoked: 1, expiresAt: 1 },
  { name: "userTokenIndex" },
);

const RefreshToken = mongoose.models.RefreshToken ||
  mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
