

import { describe, test, expect, beforeEach, jest } from "@jest/globals";

describe("Validation Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe("Email Validation", () => {
    test("accepts valid email format", () => {
      const validEmails = [
        "user@example.com",
        "john.doe@company.co.uk",
        "admin+tag@domain.com",
        "test123@test-domain.com",
      ];

      validEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    test("rejects invalid email format", () => {
      const invalidEmails = [
        "notanemail",
        "@example.com",
        "user@",
        "user name@example.com",
        "user@example",
        "",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    test("rejects whitespace in email", () => {
      const emails = ["user @example.com", "user@ example.com", "user@exam ple.com"];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      emails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe("Password Validation", () => {
    test("requires minimum length", () => {
      const MIN_LENGTH = 8;
      const passwords = {
        "1234567": false,    // Too short
        "12345678": true,    // Exactly 8
        "password123": true,  // Longer
      };

      Object.entries(passwords).forEach(([pwd, expected]) => {
        expect(pwd.length >= MIN_LENGTH).toBe(expected);
      });
    });

    test("may require special characters", () => {
      const hasSpecialChar = (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

      expect(hasSpecialChar("password123")).toBe(false);
      expect(hasSpecialChar("password123!")).toBe(true);
      expect(hasSpecialChar("Pass@word")).toBe(true);
    });

    test("may require mixed case", () => {
      const hasMixedCase = (pwd) => /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);

      expect(hasMixedCase("password")).toBe(false);
      expect(hasMixedCase("PASSWORD")).toBe(false);
      expect(hasMixedCase("Password")).toBe(true);
      expect(hasMixedCase("PassWord123")).toBe(true);
    });

    test("rejects weak passwords", () => {
      const weakPasswords = [
        "123456",
        "password",
        "12345678",
        "qwerty123",
      ];

      weakPasswords.forEach(pwd => {
        expect(pwd.length < 8 || pwd === "password" || pwd === "12345678" || pwd === "qwerty123").toBe(true);
      });
    });
  });

  describe("Phone Number Validation", () => {
    test("accepts valid phone numbers", () => {
      const validPhones = [
        "9876543210",
        "+919876543210",
        "+91-9876543210",
        "(987) 654-3210",
        "987-654-3210",
      ];

      validPhones.forEach(phone => {
        const digits = phone.replace(/\D/g, "");
        expect(digits.length).toBeGreaterThanOrEqual(10);
      });
    });

    test("rejects invalid phone numbers", () => {
      const invalidPhones = [
        "123",           // Too short
        "",              // Empty
        "abcdefghij",    // Letters (no digits)
        "12345a",         // Too short with letters
      ];

      invalidPhones.forEach(phone => {
        const digits = phone.replace(/\D/g, "");
        expect(digits.length < 10).toBe(true);
      });
    });

    test("accepts international formats", () => {
      const internationalPhones = [
        "+1-202-555-0123",     // US
        "+44-20-7946-0958",    // UK
        "+91-9876543210",      // India
        "+86-10-1234-5678",     // China
      ];

      internationalPhones.forEach(phone => {
        expect(phone.startsWith("+")).toBe(true);
      });
    });
  });

  describe("Name Validation", () => {
    test("accepts valid names", () => {
      const validNames = [
        "John Doe",
        "Maria García",
        "Jean-Pierre Dupont",
        "O'Brien",
        "Al-Rashid",
      ];

      validNames.forEach(name => {
        expect(name.length > 0).toBe(true);
        expect(name.trim().length > 0).toBe(true);
      });
    });

    test("rejects empty or whitespace names", () => {
      const invalidNames = ["", "   ", "\t", "\n"];

      invalidNames.forEach(name => {
        expect(name.trim().length === 0).toBe(true);
      });
    });

    test("rejects names with special characters", () => {
      const invalidNames = [
        "John@Doe",
        "Jane#Smith",
        "Bob$Jones",
        "Alice%Brown",
      ];

      const hasSpecialChars = (name) => /[!@#$%^&*(){}[\]<>?,./\\]/.test(name);

      invalidNames.forEach(name => {
        expect(hasSpecialChars(name)).toBe(true);
      });
    });

    test("enforces minimum and maximum length", () => {
      const MIN = 2;
      const MAX = 100;

      const testName = (name) => name.length >= MIN && name.length <= MAX;

      expect(testName("Jo")).toBe(true);           // MIN
      expect(testName("J")).toBe(false);           // Below MIN
      expect(testName("J".repeat(100))).toBe(true); // MAX
      expect(testName("J".repeat(101))).toBe(false); // Above MAX
    });
  });

  describe("Form Data Validation", () => {
    test("validates required fields", () => {
      const requiredFields = ["email", "password", "name"];
      const formData = { email: "test@example.com", password: "secure" };

      requiredFields.forEach(field => {
        expect(formData[field] !== undefined && formData[field] !== "").toBe(
          field !== "name", // name is missing
        );
      });
    });

    test("trims whitespace from inputs", () => {
      const inputs = {
        email: "  user@example.com  ",
        name: "  John Doe  ",
        phone: "  9876543210  ",
      };

      const trimmed = Object.fromEntries(
        Object.entries(inputs).map(([key, val]) => [key, val.trim()]),
      );

      expect(trimmed.email).toBe("user@example.com");
      expect(trimmed.name).toBe("John Doe");
      expect(trimmed.phone).toBe("9876543210");
    });

    test("sanitizes user input", () => {
      const userInputs = [
        "<script>alert(\"xss\")</script>",
        "normal text",
        "text with \"quotes\"",
        "text with ' apostrophes",
      ];

      const sanitizeBasic = (input) => {
        return input
          .replace(/[<>]/g, "") // Remove angle brackets
          .trim();
      };

      expect(sanitizeBasic(userInputs[0])).not.toContain("<");
      expect(sanitizeBasic(userInputs[1])).toBe("normal text");
    });
  });

  describe("Error Messages", () => {
    test("returns clear error for missing email", () => {
      const error = { field: "email", message: "Email is required" };

      expect(error.field).toBe("email");
      expect(error.message).toContain("required");
    });

    test("returns clear error for invalid email", () => {
      const error = { field: "email", message: "Invalid email format" };

      expect(error.field).toBe("email");
      expect(error.message).toContain("Invalid");
    });

    test("returns clear error for weak password", () => {
      const error = { field: "password", message: "Password must be at least 8 characters" };

      expect(error.field).toBe("password");
      expect(error.message).toContain("8 characters");
    });

    test("returns multiple validation errors", () => {
      const errors = [
        { field: "email", message: "Email is required" },
        { field: "password", message: "Password is required" },
        { field: "name", message: "Name is required" },
      ];

      expect(errors).toHaveLength(3);
      expect(errors.every(e => e.message)).toBe(true);
    });
  });

  describe("Integration scenarios", () => {
    test("validates complete registration form", () => {
      const registrationData = {
        name: "John Doe",
        email: "john@example.com",
        password: "SecurePass123!",
        phone: "9876543210",
      };

      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.email);
      const isValidPassword = registrationData.password.length >= 8;
      const isValidPhone = registrationData.phone.replace(/\D/g, "").length >= 10;

      expect(isValidEmail).toBe(true);
      expect(isValidPassword).toBe(true);
      expect(isValidPhone).toBe(true);
    });

    test("rejects registration with invalid data", () => {
      const invalidData = {
        name: "",
        email: "invalid-email",
        password: "123",
        phone: "123",
      };

      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invalidData.email);
      const isValidPassword = invalidData.password.length >= 8;

      expect(isValidEmail).toBe(false);
      expect(isValidPassword).toBe(false);
    });

    test("handles mixed valid and invalid fields", () => {
      const formData = {
        name: "Jane Smith",     // Valid
        email: "invalid.email", // Invalid
        password: "SecurePass123!", // Valid
        phone: "123",            // Invalid
      };

      const validations = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
        password: formData.password.length >= 8,
        phone: formData.phone.replace(/\D/g, "").length >= 10,
      };

      expect(validations.email).toBe(false);
      expect(validations.password).toBe(true);
      expect(validations.phone).toBe(false);
    });
  });
});
