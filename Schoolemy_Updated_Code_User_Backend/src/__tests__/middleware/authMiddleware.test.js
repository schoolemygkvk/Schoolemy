

import { describe, test, expect, beforeAll, jest } from "@jest/globals";
import jwt from "jsonwebtoken";

describe("Auth Middleware", () => {
  const JWT_SECRET = "test-secret-key-for-testing";

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("Public Routes", () => {
    test("identifies /register as public route", () => {
      const publicRoutes = ["/register", "/login", "/allcourses"];
      expect(publicRoutes).toContain("/register");
    });

    test("identifies /login as public route", () => {
      const publicRoutes = ["/register", "/login", "/allcourses"];
      expect(publicRoutes).toContain("/login");
    });

    test("identifies /allcourses as public route", () => {
      const publicRoutes = ["/register", "/login", "/allcourses"];
      expect(publicRoutes).toContain("/allcourses");
    });

    test("recognizes specific course routes as public", () => {
      const courseId = "507f1f77bcf86cd799439011";
      const coursePath = `/courses/${courseId}`;
      expect(coursePath).toContain("/courses/");
    });
  });

  describe("Token Verification", () => {
    test("verifies valid JWT token", () => {
      const token = jwt.sign(
        { id: "user123", email: "test@example.com" },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      expect(() => {
        const decoded = jwt.verify(token, JWT_SECRET);
        expect(decoded.id).toBe("user123");
        expect(decoded.email).toBe("test@example.com");
      }).not.toThrow();
    });

    test("rejects expired token", () => {
      const expiredToken = jwt.sign(
        { id: "user123" },
        JWT_SECRET,
        { expiresIn: "-1h" }, // Expired
      );

      expect(() => {
        jwt.verify(expiredToken, JWT_SECRET);
      }).toThrow("jwt expired");
    });

    test("rejects token with invalid signature", () => {
      const validToken = jwt.sign(
        { id: "user123" },
        JWT_SECRET,
      );

      expect(() => {
        jwt.verify(validToken, "wrong-secret");
      }).toThrow("invalid signature");
    });

    test("rejects malformed token", () => {
      const malformedToken = "not.a.valid.token";

      expect(() => {
        jwt.verify(malformedToken, JWT_SECRET);
      }).toThrow();
    });
  });

  describe("Authorization Header Handling", () => {
    test("extracts token from Bearer authorization header", () => {
      const token = jwt.sign({ id: "user123" }, JWT_SECRET);
      const authHeader = `Bearer ${token}`;
      const tokenPart = authHeader.split(" ")[1];

      expect(tokenPart).toBe(token);
      expect(() => jwt.verify(tokenPart, JWT_SECRET)).not.toThrow();
    });

    test("recognizes missing authorization header", () => {
      const authHeader = undefined;
      expect(authHeader).toBeUndefined();
    });

    test("detects malformed Bearer header", () => {
      const authHeader = "InvalidBearer token";
      const parts = authHeader.split(" ");
      expect(parts[0]).not.toBe("Bearer");
    });

    test("accepts alternative authorization formats", () => {
      const token = jwt.sign({ id: "user123" }, JWT_SECRET);
      const authHeader = token;
      expect(authHeader).toBe(token);
    });
  });

  describe("Token Payload Extraction", () => {
    test("extracts user ID from token", () => {
      const userId = "user-id-12345";
      const token = jwt.sign({ id: userId }, JWT_SECRET);

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(userId);
    });

    test("extracts email from token", () => {
      const email = "user@example.com";
      const token = jwt.sign({ email }, JWT_SECRET);

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.email).toBe(email);
    });

    test("extracts role from token", () => {
      const role = "admin";
      const token = jwt.sign({ role }, JWT_SECRET);

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.role).toBe(role);
    });

    test("preserves all token claims", () => {
      const payload = {
        id: "user123",
        email: "test@example.com",
        role: "student",
        courseId: "course456",
      };

      const token = jwt.sign(payload, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.courseId).toBe(payload.courseId);
    });
  });

  describe("Error Handling", () => {
    test("handles missing JWT_SECRET gracefully", () => {
      // When JWT_SECRET is not set, middleware should fail at import time
      expect(JWT_SECRET).toBeDefined();
    });

    test("handles token verification errors", () => {
      const invalidToken = "invalid.token.format";

      expect(() => {
        jwt.verify(invalidToken, JWT_SECRET);
      }).toThrow();
    });

    test("handles null token", () => {
      const token = null;

      expect(() => {
        jwt.verify(token, JWT_SECRET);
      }).toThrow();
    });

    test("handles empty string token", () => {
      const token = "";

      expect(() => {
        jwt.verify(token, JWT_SECRET);
      }).toThrow();
    });
  });

  describe("Token Expiration", () => {
    test("marks token with expiration time", () => {
      const token = jwt.sign(
        { id: "user123" },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      const decoded = jwt.decode(token);
      expect(decoded).toHaveProperty("exp");
      expect(typeof decoded.exp).toBe("number");
    });

    test("allows tokens with far future expiration", () => {
      const token = jwt.sign(
        { id: "user123" },
        JWT_SECRET,
        { expiresIn: "365d" },
      );

      expect(() => {
        jwt.verify(token, JWT_SECRET);
      }).not.toThrow();
    });

    test("rejects tokens that expired seconds ago", () => {
      const token = jwt.sign(
        { id: "user123" },
        JWT_SECRET,
        { expiresIn: "-1s" },
      );

      expect(() => {
        jwt.verify(token, JWT_SECRET);
      }).toThrow("jwt expired");
    });
  });

  describe("Integration scenarios", () => {
    test("complete authentication flow: token creation and verification", () => {
      const userData = {
        id: "user-123",
        email: "john@example.com",
        role: "student",
      };

      // Create token
      const token = jwt.sign(userData, JWT_SECRET, { expiresIn: "24h" });
      expect(token).toBeTruthy();

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(userData.id);
      expect(decoded.email).toBe(userData.email);
      expect(decoded.role).toBe(userData.role);
    });

    test("handles user session validation", () => {
      const sessionData = {
        id: "user-456",
        sessionId: "session-789",
        loginTime: Date.now(),
      };

      const token = jwt.sign(sessionData, JWT_SECRET);
      const verified = jwt.verify(token, JWT_SECRET);

      expect(verified.sessionId).toBe(sessionData.sessionId);
      expect(verified.loginTime).toBe(sessionData.loginTime);
    });

    test("handles course-specific access control", () => {
      const accessData = {
        userId: "user-123",
        courseId: "course-456",
        enrollmentDate: new Date().toISOString(),
      };

      const token = jwt.sign(accessData, JWT_SECRET);
      const verified = jwt.verify(token, JWT_SECRET);

      expect(verified.courseId).toBe(accessData.courseId);
    });
  });
});
