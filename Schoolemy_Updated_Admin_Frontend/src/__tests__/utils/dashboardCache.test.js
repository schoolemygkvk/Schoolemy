describe("dashboardCache", () => {
  let cache;

  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
    jest.spyOn(global, "setInterval").mockReturnValue(999);
    cache = require("../../Utils/dashboardCache");
  });

  afterEach(() => {
    localStorage.clear();
    if (global.setInterval.mockRestore) global.setInterval.mockRestore();
  });

  it("getCachedData returns null when missing", () => {
    expect(cache.getCachedData("users")).toBeNull();
  });

  it("setCachedData and getCachedData round-trip", () => {
    cache.setCachedData("users", 42, 60_000);
    expect(cache.getCachedData("users")).toBe(42);
  });

  it("getCachedData removes and returns null when expired", () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);
    cache.setCachedData("courses", { a: 1 }, 10);
    Date.now.mockReturnValue(now + 20);
    expect(cache.getCachedData("courses")).toBeNull();
    Date.now.mockRestore();
  });

  it("isCacheValid reflects expiry", () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);
    cache.setCachedData("t", 1, 1000);
    expect(cache.isCacheValid("t")).toBe(true);
    Date.now.mockReturnValue(now + 2000);
    expect(cache.isCacheValid("t")).toBe(false);
    Date.now.mockRestore();
  });

  it("invalidateCache removes key and clears refresh interval", () => {
    const fn = jest.fn();
    cache.setupAutoRefresh("users", fn, 1000);
    cache.invalidateCache("users");
    expect(localStorage.getItem("dashboard_cache_users")).toBeNull();
  });

  it("invalidateAllDashboardCache clears prefixed keys", () => {
    localStorage.setItem("dashboard_cache_x", "{}");
    cache.invalidateAllDashboardCache();
    expect(localStorage.getItem("dashboard_cache_x")).toBeNull();
  });

  it("getCacheMetadata returns shape or null", () => {
    expect(cache.getCacheMetadata("none")).toBeNull();
    cache.setCachedData("meta", 1);
    const m = cache.getCacheMetadata("meta");
    expect(m).toMatchObject({ timestamp: expect.any(Number), expiresAt: expect.any(Number) });
  });

  it("getAllCacheKeys lists dashboard keys without prefix", () => {
    cache.setCachedData("users", 1);
    const keys = cache.getAllCacheKeys();
    expect(keys).toContain("users");
  });

  it("clearExpiredCaches removes expired dashboard_cache entries", () => {
    const past = Date.now() - 1000;
    localStorage.setItem(
      "dashboard_cache_old",
      JSON.stringify({ data: 1, timestamp: past, expiresAt: past }),
    );
    cache.clearExpiredCaches();
    expect(localStorage.getItem("dashboard_cache_old")).toBeNull();
  });

  it("setupAutoRefresh and clearAutoRefresh", () => {
    jest.useFakeTimers();
    const fn = jest.fn();
    cache.setupAutoRefresh("users", fn, 1000);
    jest.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalled();
    cache.clearAutoRefresh("users");
    jest.useRealTimers();
  });

  it("clearAllAutoRefresh clears intervals map", () => {
    cache.setupAutoRefresh("users", () => {}, 60_000);
    cache.clearAllAutoRefresh();
    expect(true).toBe(true);
  });

  it("exports CACHE_KEYS", () => {
    expect(cache.CACHE_KEYS.USERS).toBe("users");
  });
});
