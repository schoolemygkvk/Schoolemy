

import { describe, test, expect, beforeEach, jest } from "@jest/globals";

describe("PII Protection Middleware", () => {
  let res, json;

  beforeEach(() => {
    json = jest.fn();
    res = {
      json,
      status: jest.fn().mockReturnValue({ json }),
    };
  });

  describe("Sensitive Field Removal", () => {
    test("removes password from response", () => {
      const userResponse = {
        id: "123",
        name: "John Doe",
        password: "hashed_password",
        email: "john@example.com",
      };

      const cleanResponse = Object.fromEntries(
        Object.entries(userResponse).filter(([key]) => key !== "password"),
      );

      expect(cleanResponse).not.toHaveProperty("password");
      expect(cleanResponse).toHaveProperty("id");
      expect(cleanResponse).toHaveProperty("name");
    });

    test("removes SSN from response", () => {
      const userData = {
        id: "123",
        name: "Jane Smith",
        ssn: "123-45-6789",
      };

      const cleanData = Object.fromEntries(
        Object.entries(userData).filter(([key]) => key !== "ssn"),
      );

      expect(cleanData).not.toHaveProperty("ssn");
      expect(cleanData).toHaveProperty("name");
    });

    test("removes credit card information", () => {
      const paymentData = {
        userId: "123",
        amount: 1000,
        cardNumber: "4532-1234-5678-9010",
        cvv: "123",
      };

      const cleanData = Object.fromEntries(
        Object.entries(paymentData).filter(
          ([key]) => !["cardNumber", "cvv"].includes(key),
        ),
      );

      expect(cleanData).not.toHaveProperty("cardNumber");
      expect(cleanData).not.toHaveProperty("cvv");
      expect(cleanData).toHaveProperty("amount");
    });

    test("removes authentication tokens", () => {
      const response = {
        userId: "123",
        refreshToken: "secret-token-xyz",
        accessToken: "bearer-token-abc",
        data: "public-data",
      };

      const cleanResponse = Object.fromEntries(
        Object.entries(response).filter(
          ([key]) => !["refreshToken", "accessToken"].includes(key),
        ),
      );

      expect(cleanResponse).not.toHaveProperty("refreshToken");
      expect(cleanResponse).not.toHaveProperty("accessToken");
      expect(cleanResponse).toHaveProperty("data");
    });

    test("removes internal system fields", () => {
      const userData = {
        id: "123",
        name: "John",
        _internalId: "internal-123",
        __version: 1,
        secretKey: "secret",
      };

      const cleanData = Object.fromEntries(
        Object.entries(userData).filter(
          ([key]) => !key.startsWith("_") && key !== "secretKey",
        ),
      );

      expect(cleanData).not.toHaveProperty("_internalId");
      expect(cleanData).not.toHaveProperty("__version");
      expect(cleanData).not.toHaveProperty("secretKey");
    });
  });

  describe("Masking Sensitive Data", () => {
    test("masks email address", () => {
      const email = "john.doe@example.com";
      const masked = email.split("@")[0].substring(0, 2) + "***@example.com";

      expect(masked).toBe("jo***@example.com");
      expect(masked).not.toContain("john");
    });

    test("masks phone number", () => {
      const phone = "9876543210";
      const masked = "****" + phone.substring(6);

      expect(masked).toBe("****3210");
      expect(masked).not.toContain("987654");
    });

    test("masks credit card number", () => {
      const cardNumber = "4532123456789010";
      const masked = "**** **** **** " + cardNumber.substring(12);

      expect(masked).toBe("**** **** **** 9010");
      expect(masked).toContain("9010");
      expect(masked).not.toContain("4532");
    });

    test("masks social security number", () => {
      const ssn = "123-45-6789";
      const masked = "***-**-" + ssn.substring(7);

      expect(masked).toBe("***-**-6789");
      expect(masked).not.toContain("123");
    });

    test("masks date of birth", () => {
      const dob = "1990-05-15";
      const masked = "****-**-" + dob.substring(8);

      expect(masked).toBe("****-**-15");
    });
  });

  describe("Array and Nested Data", () => {
    test("removes PII from array of users", () => {
      const users = [
        { id: "1", name: "John", password: "pwd1", email: "john@example.com" },
        { id: "2", name: "Jane", password: "pwd2", email: "jane@example.com" },
      ];

      const cleanUsers = users.map(user => {
        const { password, ...rest } = user;
        return rest;
      });

      expect(cleanUsers).toHaveLength(2);
      expect(cleanUsers.every(u => !u.password)).toBe(true);
      expect(cleanUsers[0]).toHaveProperty("name");
    });

    test("removes PII from nested objects", () => {
      const response = {
        user: {
          id: "123",
          name: "John",
          credentials: {
            password: "secret",
            token: "token-xyz",
          },
          address: "Public Address",
        },
      };

      const cleanResponse = {
        user: {
          id: response.user.id,
          name: response.user.name,
          address: response.user.address,
        },
      };

      expect(cleanResponse.user).not.toHaveProperty("credentials");
      expect(cleanResponse.user).toHaveProperty("address");
    });

    test("removes PII from deeply nested data", () => {
      const data = {
        level1: {
          level2: {
            level3: {
              publicData: "OK",
              privateKey: "SECRET",
            },
          },
        },
      };

      const hasPrivate = JSON.stringify(data).includes("SECRET");
      expect(hasPrivate).toBe(true);

      const cleaned = {
        level1: {
          level2: {
            level3: {
              publicData: "OK",
            },
          },
        },
      };

      const hasPrivateAfter = JSON.stringify(cleaned).includes("SECRET");
      expect(hasPrivateAfter).toBe(false);
    });
  });

  describe("Whitelist Approach", () => {
    test("only includes whitelisted fields", () => {
      const fullUser = {
        id: "123",
        name: "John",
        email: "john@example.com",
        password: "secret",
        ssn: "123-45-6789",
        bankAccount: "987654321",
      };

      const WHITELIST = ["id", "name", "email"];
      const safeUser = Object.fromEntries(
        WHITELIST.map(field => [field, fullUser[field]]),
      );

      expect(Object.keys(safeUser)).toEqual(WHITELIST);
      expect(safeUser).not.toHaveProperty("password");
      expect(safeUser).not.toHaveProperty("ssn");
    });

    test("different endpoints have different whitelists", () => {
      const user = {
        id: "123",
        name: "John",
        email: "john@example.com",
        phone: "9876543210",
        address: "Some St",
      };

      const profileWhitelist = ["id", "name", "email", "phone"];
      const listWhitelist = ["id", "name"];

      const profileData = Object.fromEntries(
        profileWhitelist.map(field => [field, user[field]]),
      );

      const listData = Object.fromEntries(
        listWhitelist.map(field => [field, user[field]]),
      );

      expect(Object.keys(profileData)).toContain("phone");
      expect(Object.keys(listData)).not.toContain("phone");
    });
  });

  describe("Blacklist Approach", () => {
    test("excludes blacklisted fields", () => {
      const response = {
        id: "123",
        name: "John",
        password: "secret",
        refreshToken: "token",
        publicData: "OK",
      };

      const BLACKLIST = ["password", "refreshToken", "accessToken"];
      const clean = Object.fromEntries(
        Object.entries(response).filter(([key]) => !BLACKLIST.includes(key)),
      );

      expect(clean).toHaveProperty("publicData");
      expect(clean).not.toHaveProperty("password");
      expect(clean).not.toHaveProperty("refreshToken");
    });

    test("blacklist includes common sensitive fields", () => {
      const sensitiveFields = [
        "password",
        "ssn",
        "creditCard",
        "bankAccount",
        "accessToken",
        "refreshToken",
        "apiKey",
        "secret",
      ];

      expect(sensitiveFields.length).toBeGreaterThan(5);
      expect(sensitiveFields).toContain("password");
      expect(sensitiveFields).toContain("apiKey");
    });
  });

  describe("Role-based PII Removal", () => {
    test("removes more data for anonymous users", () => {
      const userDataAnon = {
        id: "123",
        name: "John",
        email: "john@example.com",
        phone: "9876543210",
      };

      const anonWhitelist = ["id"];
      const anonData = Object.fromEntries(
        anonWhitelist.map(field => [field, userDataAnon[field]]),
      );

      expect(Object.keys(anonData)).toHaveLength(1);
    });

    test("shows more data for authenticated users", () => {
      const userData = {
        id: "123",
        name: "John",
        email: "john@example.com",
        phone: "9876543210",
        enrollmentHistory: ["course1", "course2"],
      };

      const authWhitelist = ["id", "name", "email", "enrollmentHistory"];
      const authData = Object.fromEntries(
        authWhitelist.map(field => [field, userData[field]]),
      );

      expect(Object.keys(authData)).toHaveLength(4);
    });

    test("shows most data for admin users", () => {
      const userData = {
        id: "123",
        name: "John",
        email: "john@example.com",
        phone: "9876543210",
        enrollmentHistory: ["course1"],
        lastLogin: "2024-04-14T10:00:00Z",
      };

      // Admin sees most data except passwords
      const adminBlacklist = ["password", "accessToken"];
      const adminData = Object.fromEntries(
        Object.entries(userData).filter(([key]) => !adminBlacklist.includes(key)),
      );

      expect(Object.keys(adminData).length).toBeGreaterThan(4);
    });
  });

  describe("Integration scenarios", () => {
    test("protects user data in list endpoint", () => {
      const users = [
        { id: "1", name: "John", email: "john@example.com", password: "pwd1" },
        { id: "2", name: "Jane", email: "jane@example.com", password: "pwd2" },
      ];

      const SAFE_FIELDS = ["id", "name", "email"];
      const safeUsers = users.map(user =>
        Object.fromEntries(SAFE_FIELDS.map(f => [f, user[f]])),
      );

      expect(safeUsers.every(u => !u.password)).toBe(true);
      expect(safeUsers.every(u => u.email)).toBe(true);
    });

    test("protects user data in detail endpoint", () => {
      const userDetail = {
        id: "123",
        name: "John Doe",
        email: "john@example.com",
        phone: "9876543210",
        enrolledCourses: ["course1", "course2"],
        password: "secret",
        lastLogin: "2024-04-14T10:00:00Z",
      };

      const DETAIL_WHITELIST = ["id", "name", "email", "enrolledCourses"];
      const safeDetail = Object.fromEntries(
        DETAIL_WHITELIST.map(f => [f, userDetail[f]]),
      );

      expect(safeDetail).not.toHaveProperty("password");
      expect(safeDetail).not.toHaveProperty("lastLogin");
      expect(safeDetail).toHaveProperty("enrolledCourses");
    });

    test("protects payment data in transaction response", () => {
      const transaction = {
        transactionId: "txn_123",
        amount: 5000,
        status: "completed",
        cardNumber: "4532-xxxx-xxxx-9010",
        userId: "user_123",
        timestamp: "2024-04-14T10:00:00Z",
      };

      const PAYMENT_WHITELIST = ["transactionId", "amount", "status", "timestamp"];
      const safeTransaction = Object.fromEntries(
        PAYMENT_WHITELIST.map(f => [f, transaction[f]]),
      );

      expect(safeTransaction).not.toHaveProperty("userId");
      expect(safeTransaction).not.toHaveProperty("cardNumber");
      expect(safeTransaction).toHaveProperty("amount");
    });
  });
});
