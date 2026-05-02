import { renderHook } from "@testing-library/react";
import "@testing-library/jest-dom";
import { getToken, clearToken, hasToken, useToken } from "../../Hooks/useToken";

jest.mock("../../Utils/security", () => ({
  secureStorage: {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
  },
}));

import { secureStorage } from "../../Utils/security";

describe("useToken (httpOnly cookie era)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getToken", () => {
    it("always returns null (token not readable from JS)", () => {
      expect(getToken()).toBeNull();
      expect(secureStorage.getItem).not.toHaveBeenCalled();
    });
  });

  describe("clearToken", () => {
    it("clears user metadata keys used for auth UI", () => {
      clearToken();
      expect(secureStorage.removeItem).toHaveBeenCalledWith("_id");
      expect(secureStorage.removeItem).toHaveBeenCalledWith("role");
      expect(secureStorage.removeItem).toHaveBeenCalledWith("name");
      expect(secureStorage.removeItem).toHaveBeenCalledWith("isApproved");
    });
  });

  describe("hasToken", () => {
    it("returns true when _id and role are set", () => {
      secureStorage.getItem.mockImplementation((key) => {
        if (key === "_id") return "u1";
        if (key === "role") return "admin";
        return null;
      });
      expect(hasToken()).toBe(true);
    });

    it("returns false when either is missing", () => {
      secureStorage.getItem.mockImplementation((key) => {
        if (key === "_id") return "u1";
        if (key === "role") return null;
        return null;
      });
      expect(hasToken()).toBe(false);
    });
  });

  describe("useToken hook", () => {
    it("exposes isAuthenticated from _id + role", () => {
      secureStorage.getItem.mockImplementation((key) => {
        if (key === "_id") return "u1";
        if (key === "role") return "admin";
        return null;
      });
      const { result } = renderHook(() => useToken());
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userId).toBe("u1");
      expect(result.current.role).toBe("admin");
      expect(typeof result.current.getAuthStatus).toBe("function");
    });

    it("getAuthStatus reads _id and role from storage", () => {
      secureStorage.getItem.mockImplementation((key) => {
        if (key === "_id") return "x";
        if (key === "role") return "auditor";
        return null;
      });
      const { result } = renderHook(() => useToken());
      expect(result.current.getAuthStatus()).toEqual({
        isAuthenticated: true,
        userId: "x",
        role: "auditor",
      });
    });
  });
});
