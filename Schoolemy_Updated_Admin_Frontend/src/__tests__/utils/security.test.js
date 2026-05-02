import {
  secureStorage,
  isValidToken,
  hasStoredSession,
  hasClientAuthSession,
  sanitizeInput,
  isSecureConnection,
  enforceHTTPS,
  generateCSRFToken,
  getCSRFToken,
} from "../../Utils/security";

describe("security utilities", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    delete window.location;
    window.location = {
      protocol: "http:",
      hostname: "localhost",
      href: "http://localhost/",
      replace: jest.fn(),
    };
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("secureStorage round-trips values in localStorage", () => {
    secureStorage.setItem("token", "hello-world-token-value");
    const raw = localStorage.getItem("token");
    expect(raw).toBe("hello-world-token-value");
    expect(secureStorage.getItem("token")).toBe("hello-world-token-value");
  });

  it("secureStorage getItem returns null when missing", () => {
    expect(secureStorage.getItem("missing")).toBeNull();
  });

  it("isValidToken", () => {
    expect(isValidToken(null)).toBe(false);
    expect(isValidToken("short")).toBe(false);
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString("base64");
    const header = Buffer.from(JSON.stringify({ alg: "HS256" }), "utf8").toString("base64");
    const validJwt = `${header}.${payload}.signature`;
    expect(isValidToken(validJwt)).toBe(true);
  });

  it("hasStoredSession is false when any of id/role/name missing", () => {
    secureStorage.setItem("_id", "1");
    secureStorage.setItem("role", "admin");
    expect(hasStoredSession()).toBe(false);
  });

  it("hasStoredSession is true when id, role, and name are set", () => {
    secureStorage.setItem("_id", "1");
    secureStorage.setItem("role", "admin");
    secureStorage.setItem("name", "Test");
    expect(hasStoredSession()).toBe(true);
  });

  it("hasClientAuthSession is true with cookie session markers only", () => {
    secureStorage.setItem("_id", "1");
    secureStorage.setItem("role", "superadmin");
    secureStorage.setItem("name", "User");
    expect(hasClientAuthSession()).toBe(true);
  });

  it("sanitizeInput escapes HTML-sensitive chars", () => {
    expect(sanitizeInput(`<script>&"'/</script>`)).toContain("&lt;");
  });

  it("sanitizeInput passes through non-strings", () => {
    expect(sanitizeInput(3)).toBe(3);
  });

  it("isSecureConnection for localhost http", () => {
    expect(isSecureConnection()).toBe(true);
  });

  it("enforceHTTPS does not redirect on localhost", () => {
    process.env.NODE_ENV = "production";
    enforceHTTPS();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it("generateCSRFToken returns 32 hex chars", () => {
    const t = generateCSRFToken();
    expect(t).toMatch(/^[0-9a-f]{32}$/);
  });

  it("getCSRFToken reads or creates session token", () => {
    sessionStorage.removeItem("csrf_token");
    const t = getCSRFToken();
    expect(t).toMatch(/^[0-9a-f]{32}$/);
    expect(sessionStorage.getItem("csrf_token")).toBe(t);
  });
});
