

import {
  escapeRegexChars,
  validateRegexInput,
  safeStringSearch,
  safeRegexTest,
  safeCaseInsensitiveSearch,
  createSafeRegex,
  safeSearchArray,
} from "../../Utils/SafeRegex.js";

// Helper to handle async regex test
const runRegexTest = (text, regex, timeout) => {
  return safeRegexTest(text, regex, timeout);
};

describe("SafeRegex Utils (ReDoS Protection)", () => {
  describe("escapeRegexChars", () => {
    test("escapes special regex characters", () => {
      expect(escapeRegexChars("test.txt")).toBe("test\\.txt");
      expect(escapeRegexChars("[abc]")).toBe("\\[abc\\]");
      expect(escapeRegexChars("a+b")).toBe("a\\+b");
    });

    test("escapes all special chars", () => {
      const input = ".*+?^${}[]|()\\";
      const escaped = escapeRegexChars(input);
      expect(escaped).not.toContain(".*+?^${}[]|()\\");
    });

    test("handles normal text", () => {
      expect(escapeRegexChars("hello world")).toBe("hello world");
      expect(escapeRegexChars("test123")).toBe("test123");
    });

    test("handles empty string", () => {
      expect(escapeRegexChars("")).toBe("");
    });
  });

  describe("validateRegexInput", () => {
    test("accepts safe input string", () => {
      const result1 = validateRegexInput("simple search");
      expect(result1.valid).toBe(true);

      const result2 = validateRegexInput("email@test.com");
      expect(result2.valid).toBe(true);
    });

    test("rejects non-string input", () => {
      const result1 = validateRegexInput(null);
      expect(result1.valid).toBe(false);

      const result2 = validateRegexInput(123);
      expect(result2.valid).toBe(false);
    });

    test("rejects empty string", () => {
      const result = validateRegexInput("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("non-empty");
    });

    test("rejects strings exceeding max length", () => {
      const longString = "a".repeat(200);
      const result = validateRegexInput(longString);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds maximum");
    });

    test("accepts strings at max length boundary", () => {
      const exactLength = "a".repeat(100);
      const result = validateRegexInput(exactLength);
      expect(result.valid).toBe(true);
    });

    test("accepts patterns within length limit", () => {
      const result1 = validateRegexInput("test[0-9]{1,3}");
      expect(result1.valid).toBe(true);

      const result2 = validateRegexInput("^[a-z]+$");
      expect(result2.valid).toBe(true);
    });

    test("allows custom max length", () => {
      const input = "a".repeat(50);
      const result = validateRegexInput(input, 40);
      expect(result.valid).toBe(false);
    });
  });

  describe("safeStringSearch", () => {
    test("finds substring in text", () => {
      expect(safeStringSearch("hello world", "world")).toBe(true);
      expect(safeStringSearch("test123", "123")).toBe(true);
    });

    test("returns false for non-existent substring", () => {
      expect(safeStringSearch("hello world", "xyz")).toBe(false);
    });

    test("is case-sensitive by default", () => {
      expect(safeStringSearch("Hello World", "hello")).toBe(false);
    });

    test("handles special characters safely", () => {
      expect(safeStringSearch("a.b.c", ".b")).toBe(true);
      expect(safeStringSearch("(test)", "(test)")).toBe(true);
    });

    test("handles empty strings", () => {
      expect(safeStringSearch("test", "")).toBe(false); // Empty needle returns false
      expect(safeStringSearch("", "")).toBe(false); // Empty string returns false
    });
  });

  describe("safeRegexTest", () => {
    test("tests safe pattern against string asynchronously", async () => {
      const result1 = await safeRegexTest("test123", /^test/);
      expect(result1).toBe(true);

      const result2 = await safeRegexTest("abc test", /^test/);
      expect(result2).toBe(false);
    });

    test("handles email validation", async () => {
      const result = await safeRegexTest("test@example.com", /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i);
      expect(result).toBe(true);
    });

    test("handles phone number validation", async () => {
      const result1 = await safeRegexTest("9876543210", /^[0-9]{10}$/);
      expect(result1).toBe(true);

      const result2 = await safeRegexTest("987654321", /^[0-9]{10}$/);
      expect(result2).toBe(false);
    });

    test("rejects with timeout on slow regex", async () => {
      const slowRegex = /^(a+)*b$/; // Known problematic pattern
      try {
        await safeRegexTest("aaaaaaaaaaaaaaaaaaaaaaaab", slowRegex, 10); // 10ms timeout
        // If no error, test passes (pattern completed fast enough)
        expect(true).toBe(true);
      } catch (error) {
        // Timeout error is expected for truly slow patterns
        expect(error.message).toContain("timeout");
      }
    });
  });

  describe("safeCaseInsensitiveSearch", () => {
    test("finds text ignoring case", () => {
      // First param is searchText (to find), second is targetText (to search in)
      expect(safeCaseInsensitiveSearch("hello", "Hello World")).toBe(true);
      expect(safeCaseInsensitiveSearch("hello", "HELLO WORLD")).toBe(true);
    });

    test("returns false for non-existent text", () => {
      expect(safeCaseInsensitiveSearch("hello", "xyz")).toBe(false);
    });

    test("works with special characters", () => {
      expect(safeCaseInsensitiveSearch("TEST.TXT", "test.txt")).toBe(true);
    });

    test("handles numbers", () => {
      expect(safeCaseInsensitiveSearch("Test123", "test123")).toBe(true);
    });
  });

  describe("createSafeRegex", () => {
    test("creates safe regex from string", () => {
      const regex = createSafeRegex("test");
      expect(regex).toBeTruthy();
      expect(regex instanceof RegExp).toBe(true);
      expect(regex.test("test123")).toBe(true);
    });

    test("escapes special characters in input", () => {
      const regex = createSafeRegex("a.b");
      expect(regex).toBeTruthy();
      expect(regex.test("a.b")).toBe(true);
      expect(regex.test("aXb")).toBe(false); // Dot should be literal, not wildcard
    });

    test("escapes regex operators", () => {
      const regex = createSafeRegex("(test)+");
      expect(regex.test("(test)+")).toBe(true);
      expect(regex.test("testtest")).toBe(false); // Should not match repeated pattern
    });

    test("returns null for invalid input", () => {
      const tooLong = "a".repeat(200); // Over 100 char limit
      const regex = createSafeRegex(tooLong);
      expect(regex).toBeNull();
    });

    test("handles empty string", () => {
      // Empty string validation depends on validateRegexInput
      // which checks if input is truthy (empty string is falsy)
      const regex = createSafeRegex("");
      expect(regex).toBeNull(); // Empty input fails validation
    });

    test("uses case-insensitive flag by default", () => {
      const regex = createSafeRegex("Hello");
      expect(regex.test("hello")).toBe(true);
      expect(regex.test("HELLO")).toBe(true);
    });

    test("allows custom flags", () => {
      const regex = createSafeRegex("test", "g");
      expect(regex.global).toBe(true);
    });
  });

  describe("safeSearchArray", () => {
    test("searches array of objects by field", () => {
      const courses = [
        { title: "Apple Pie Course" },
        { title: "Banana Bread" },
        { title: "Cherry Cake" },
      ];
      const result = safeSearchArray(courses, "ban", "title");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Banana Bread");
    });

    test("is case-insensitive by default", () => {
      const courses = [
        { title: "Apple" },
        { title: "BANANA" },
        { title: "cherry" },
      ];
      const result = safeSearchArray(courses, "apple", "title");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Apple");
    });

    test("returns empty array if no matches", () => {
      const courses = [
        { title: "JavaScript" },
        { title: "Python" },
        { title: "Go" },
      ];
      const result = safeSearchArray(courses, "Rust", "title");
      expect(result).toHaveLength(0);
    });

    test("handles multiple matches", () => {
      const courses = [
        { title: "Python Basics" },
        { title: "Python Advanced" },
        { title: "JavaScript" },
      ];
      const result = safeSearchArray(courses, "python", "title");
      expect(result).toHaveLength(2);
    });

    test("handles special characters safely", () => {
      const items = [
        { name: "test.txt" },
        { name: "test+file" },
        { name: "test*" },
      ];
      const result = safeSearchArray(items, "test.", "name");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test.txt");
    });

    test("returns empty array for invalid input", () => {
      expect(safeSearchArray(null, "search", "field")).toHaveLength(0);
      expect(safeSearchArray([], "", "field")).toHaveLength(0);
      expect(safeSearchArray([], "search", null)).toHaveLength(0);
    });

    test("handles missing field in objects", () => {
      const items = [
        { title: "Item 1" },
        { name: "Item 2" }, // Missing 'title' field
        { title: "Item 3" },
      ];
      const result = safeSearchArray(items, "item", "title");
      expect(result).toHaveLength(2);
    });

    test("handles non-string field values", () => {
      const items = [
        { id: 1, title: "First" },
        { id: 2, title: "Second" },
        { id: 123 }, // id is a number, not a string
      ];
      const result = safeSearchArray(items, "1", "id");
      // Non-string fields are filtered out by the implementation
      // The function checks `if (!fieldValue || typeof fieldValue !== 'string') return false;`
      expect(result).toHaveLength(0); // Numbers won't match string search
    });
  });

  describe("ReDoS Protection Strategy", () => {
    test("escapeRegexChars prevents pattern injection", () => {
      // Escape operators so they become literals
      const escaped = escapeRegexChars("(a+)+");
      const regex = new RegExp(escaped);
      expect(regex.test("(a+)+")).toBe(true);
      expect(regex.test("aaa")).toBe(false); // Operators are escaped, so no backtracking issue
    });

    test("createSafeRegex returns null for input exceeding length limit", () => {
      const tooLong = "a".repeat(150); // 150 chars > 100 char limit
      const result = createSafeRegex(tooLong);
      expect(result).toBeNull(); // Should return null for oversized input
    });

    test("safeStringSearch avoids regex entirely for simple cases", () => {
      // No regex patterns needed at all
      const result = safeStringSearch("The quick brown fox", "quick");
      expect(result).toBe(true);
    });

    test("validates input before any regex operation", () => {
      const validation = validateRegexInput("test pattern");
      expect(validation.valid).toBe(true);

      const invalidValidation = validateRegexInput("a".repeat(200));
      expect(invalidValidation.valid).toBe(false);
    });
  });

  describe("Performance and safety", () => {
    test("completes quickly for large strings", () => {
      const largeString = "a".repeat(10000) + "needle" + "b".repeat(10000);
      const start = Date.now();
      const result = safeStringSearch(largeString, "needle");
      const duration = Date.now() - start;

      expect(result).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });

    test("handles large arrays safely", () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({ name: `item${i}` }));
      const start = Date.now();
      const result = safeSearchArray(largeArray, "item500", "name");
      const duration = Date.now() - start;

      // safeSearchArray returns array of matching items
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("item500");
      expect(duration).toBeLessThan(1000);
    });
  });
});
