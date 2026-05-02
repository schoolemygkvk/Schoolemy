import jwt from "jsonwebtoken";
import { getJwtSecret } from "./jwtSecret.js";

export function getBearerToken(req) {
  const auth = req.headers.authorization;
  if (auth && typeof auth === "string" && auth.startsWith("Bearer ")) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }
  return null;
}


export function collectAccessTokenCandidates(req) {
  const cookieToken = req.cookies?.accessToken;
  const bearerToken = getBearerToken(req);
  const out = [];
  if (cookieToken) out.push(cookieToken);
  if (bearerToken && bearerToken !== cookieToken) out.push(bearerToken);
  return out;
}


export function verifyAccessTokenCandidates(candidates) {
  const secret = getJwtSecret();
  const errors = [];
  for (const token of candidates) {
    try {
      const decoded = jwt.verify(token, secret);
      return { ok: true, decoded };
    } catch (e) {
      errors.push(e);
    }
  }
  const allExpired =
    errors.length > 0 && errors.every((e) => e.name === "TokenExpiredError");
  if (allExpired) {
    return {
      ok: false,
      code: "TOKEN_EXPIRED",
      error: errors[errors.length - 1],
    };
  }
  return {
    ok: false,
    code: "INVALID_TOKEN",
    error: errors[errors.length - 1],
  };
}


export function decodeAccessTokenIgnoreExpiry(req) {
  const secret = getJwtSecret();
  for (const token of collectAccessTokenCandidates(req)) {
    try {
      return jwt.verify(token, secret, { ignoreExpiration: true });
    } catch {
      /* try next candidate */
    }
  }
  return null;
}
