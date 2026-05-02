

import { URL } from "url";

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
  const candidates = [
    process.env.API_URL,
    process.env.BACKEND_URL,
    process.env.SERVER_URL,
    process.env.BASE_URL,
    process.env.REACT_APP_API_URL,
  ];
  for (const c of candidates) {
    const h = hostnameFromEnvUrl(c);
    if (h) hosts.add(h);
  }
  const list = (process.env.MEDIA_URL_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  list.forEach((h) => hosts.add(h));
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

function extensionMatchesKind(pathname, kind) {
  const p = pathname.toLowerCase();
  if (kind === "audio") return AUDIO_EXT.test(p);
  if (kind === "pdf") return PDF_EXT.test(p);
  if (kind === "video") return VIDEO_EXT.test(p);
  return false;
}


export function validateLessonMediaUrl(url, kind) {
  if (typeof url !== "string" || !url.trim()) return { ok: false };
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { ok: false };
  }

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
  if (!extOk && !trusted) return { ok: false };

  return { ok: true, url: parsed.toString() };
}

function sanitizeFileArray(files, kind) {
  if (!Array.isArray(files)) return [];
  return files
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item.url;
      const v = validateLessonMediaUrl(raw, kind);
      if (!v.ok) return null;
      const plain =
        typeof item.toObject === "function" ? item.toObject() : { ...item };
      return { ...plain, url: v.url };
    })
    .filter(Boolean);
}


export function sanitizeLessonMediaUrls(lesson) {
  if (!lesson || typeof lesson !== "object") return lesson;
  const plain =
    typeof lesson.toObject === "function" ? lesson.toObject() : { ...lesson };
  return {
    ...plain,
    audioFile: sanitizeFileArray(plain.audioFile, "audio"),
    pdfFile: sanitizeFileArray(plain.pdfFile, "pdf"),
    videoFile: sanitizeFileArray(plain.videoFile, "video"),
  };
}
