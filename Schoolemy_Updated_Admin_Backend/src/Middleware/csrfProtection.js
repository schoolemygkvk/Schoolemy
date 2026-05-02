import crypto from "crypto";

const CSRF_TOKEN_COOKIE = "csrfToken";
const CSRF_TOKEN_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);


export const getCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  const isProd = process.env.NODE_ENV === "production";

  // NOT httpOnly — the frontend JS must be able to read this cookie value
  res.cookie(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours — reissue before it expires
  });

  return res.status(200).json({ csrfToken: token });
};


export const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Public and internal admin endpoints are exempt from CSRF
  // Auth endpoints: no session exists yet at login time
  // Internal APIs: use Authorization token instead (CSRF not needed for bearer tokens)
  const csrfExemptPaths = [
    // Auth endpoints
    "/adminlogin",
    "/api/admin/login",
    "/verify-otp",
    "/api/admin/verify-otp",
    "/forgot-password",
    "/api/admin/forgot-password",
    "/reset-password",
    "/api/admin/reset-password",
    "/refresh-token",
    "/api/admin/refresh-token",
    // Internal admin management (use JWT auth instead)
    "/createadmin",
    "/api/admin/createadmin",
    "/admin/create",
    "/api/admin/create",
  ];

  // Skip CSRF validation if Bearer token is present (JWT auth)
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return next();
  }

  if (csrfExemptPaths.includes(req.path)) {
    return next();
  }

  const tokenFromCookie = req.cookies?.[CSRF_TOKEN_COOKIE];
  const tokenFromHeader = req.headers[CSRF_TOKEN_HEADER];

  if (!tokenFromCookie || !tokenFromHeader) {
    return res.status(403).json({
      success: false,
      code: "CSRF_TOKEN_MISSING",
      message: "CSRF token missing from cookie or header",
    });
  }

  // Constant-time comparison to prevent timing attacks
  const cookieBuf = Buffer.from(tokenFromCookie);
  const headerBuf = Buffer.from(tokenFromHeader);

  if (
    cookieBuf.length !== headerBuf.length ||
    !crypto.timingSafeEqual(cookieBuf, headerBuf)
  ) {
    return res.status(403).json({
      success: false,
      code: "CSRF_TOKEN_INVALID",
      message: "CSRF token mismatch",
    });
  }

  next();
};
