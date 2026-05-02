


export function expiryStringToMs(expiry) {
  const s = String(expiry || "").trim().toLowerCase();
  const match = s.match(/^(\d+)([smhd])$/);
  if (!match) return 4 * 60 * 60 * 1000; // default 4 hours if unparsable
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const unitMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return n * unitMs[unit];
}

export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "4h";


export const ACCESS_TOKEN_COOKIE_MAX_MS = expiryStringToMs(process.env.REFRESH_TOKEN_EXPIRY || "30d");
