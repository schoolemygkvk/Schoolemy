import jwt from "jsonwebtoken";
import { getJwtSecret } from "./jwtSecret.js";
import { ACCESS_TOKEN_EXPIRY } from "./tokenExpiry.js";

export const JwtToken = (user) => {
  return jwt.sign(
    { id: String(user._id), email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
};