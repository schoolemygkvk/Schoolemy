/**
 * Defense-in-depth validation for lesson audio/PDF (and video) URLs from the API.
 * Blocks dangerous schemes, path traversal, and unexpected hosts.
 */

const AUDIO_EXT = /\.(mp3|m4a|wav|aac|ogg|opus|webm|flac)(\?|#|$)/i;
const PDF_EXT = /\.pdf(\?|#|$)/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv|avi)(\?|#|$)/i;

function hostnameFromEnvUrl(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return new URL(raw.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function collectExplicitHosts() {
  const hosts = new Set();
  const fromEnv = hostnameFromEnvUrl(process.env.REACT_APP_API_URL);
  if (fromEnv) hosts.add(fromEnv);
  const list = (process.env.REACT_APP_MEDIA_URL_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  list.forEach((h) => hosts.add(h));
  if (typeof window !== "undefined" && window.location?.hostname) {
    hosts.add(window.location.hostname.toLowerCase());
  }
  return hosts;
}

function isTrustedInfrastructureHost(hostname) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return true;
  if (h.endsWith(".amazonaws.com")) return true;
  if (h.endsWith(".cloudfront.net")) return true;
  return false;
}

function hostIsAllowed(hostname, explicitHosts) {
  const h = hostname.toLowerCase();
  if (isTrustedInfrastructureHost(h)) return true;
  for (const allowed of explicitHosts) {
    if (!allowed) continue;
    if (h === allowed) return true;
    if (h.endsWith(`.${allowed}`)) return true;
  }
  return false;
}

function pathnameHasTraversal(pathname) {
  const segments = pathname.split("/");
  return segments.some((s) => s === ".." || s === "%2e%2e" || s === "%2E%2E");
}

/**
 * Resolve absolute URL; supports same-origin relative paths starting with /
 */
function parseUrl(input, baseOrigin) {
  const trimmed = typeof input === "string" ? input.trim() : "";
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    if (baseOrigin && trimmed.startsWith("/")) {
      try {
        return new URL(trimmed, baseOrigin);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function extensionMatchesKind(pathname, kind) {
  const p = pathname.toLowerCase();
  if (kind === "audio") return AUDIO_EXT.test(p);
  if (kind === "pdf") return PDF_EXT.test(p);
  if (kind === "video") return VIDEO_EXT.test(p);
  return false;
}

/**
 * @param {string} url
 * @param {'audio'|'pdf'|'video'} kind
 * @returns {{ ok: boolean, url?: string }}
 */
export function validateLessonMediaUrl(url, kind) {
  const baseOrigin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : null;
  const parsed = parseUrl(url, baseOrigin);
  if (!parsed) return { ok: false };

  const scheme = parsed.protocol.replace(":", "").toLowerCase();
  if (!["http", "https"].includes(scheme)) return { ok: false };

  const isProd = process.env.NODE_ENV === "production";
  if (isProd && scheme !== "https") return { ok: false };

  if (pathnameHasTraversal(parsed.pathname)) return { ok: false };

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(parsed.pathname);
  } catch {
    return { ok: false };
  }
  if (decodedPath.includes("..")) return { ok: false };

  const explicitHosts = collectExplicitHosts();
  if (!hostIsAllowed(parsed.hostname, explicitHosts)) return { ok: false };

  const trusted = isTrustedInfrastructureHost(parsed.hostname);
  const extOk = extensionMatchesKind(parsed.pathname, kind);
  // Allow URLs without proper extensions if they're from S3, CloudFront, or same-origin
  // This handles API URLs like /api/resources/download/... that serve media with correct Content-Type headers
  if (!extOk && !trusted) {
    // Allow if hostname is same-origin (localhost dev, or same domain in production)
    const isSameOrigin = typeof window !== "undefined" && parsed.hostname === window.location.hostname;
    if (!isSameOrigin) return { ok: false };
  }

  return { ok: true, url: parsed.toString() };
}

/**
 * @param {string} url
 * @param {'audio'|'pdf'|'video'} kind
 * @returns {string|null}
 */
export function getSafeLessonMediaUrl(url, kind) {
  const r = validateLessonMediaUrl(url, kind);
  return r.ok ? r.url : null;
}

/**
 * Safe filename for the download attribute (no path segments).
 * @param {string} name
 * @param {string} fallback
 */
export function safeLessonDownloadFilename(name, fallback) {
  const fb = typeof fallback === "string" && fallback ? fallback : "download";
  if (typeof name !== "string" || !name.trim()) return fb;
  const base = name
    .replace(/[/\\?*:|"<>]/g, "")
    .replace(/\.\./g, "")
    .trim()
    .slice(0, 200);
  return base || fb;
}
