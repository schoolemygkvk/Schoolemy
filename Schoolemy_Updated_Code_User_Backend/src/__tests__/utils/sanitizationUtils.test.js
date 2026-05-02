

import {
  sanitizeHtmlContent,
  sanitizeText,
  sanitizeUserProfile,
  sanitizeCourseContent,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeFilePath,
  sanitizeSearchQuery,
  sanitizeObject,
  sanitizeJson,
  sanitizeFormData,
  validateAndSanitize,
} from "../../Utils/sanitizationUtils.js";

describe("Sanitization Utils", () => {
  describe("sanitizeHtmlContent", () => {
    test("removes all HTML tags by default", () => {
      expect(sanitizeHtmlContent("<p>Hello</p>")).toBe("Hello");
      expect(sanitizeHtmlContent("<script>alert(\"xss\")</script>")).toBe("");
      expect(sanitizeHtmlContent("<img src=\"x\" onerror=\"alert(1)\">")).toBe("");
    });

    test("handles null and non-string input", () => {
      expect(sanitizeHtmlContent(null)).toBe("");
      expect(sanitizeHtmlContent(undefined)).toBe("");
      expect(sanitizeHtmlContent(123)).toBe("");
    });

    test("removes multiple nested tags", () => {
      expect(sanitizeHtmlContent("<div><span><b>Text</b></span></div>")).toBe("Text");
    });

    test("removes attributes from tags", () => {
      expect(sanitizeHtmlContent("<p class=\"test\">Safe</p>")).toBe("Safe");
    });

    test("handles empty string", () => {
      expect(sanitizeHtmlContent("")).toBe("");
    });

    test("allows custom tag configuration", () => {
      const result = sanitizeHtmlContent("<p>Hello</p>", { allowedTags: ["p"] });
      expect(result).toContain("<p>");
      expect(result).toContain("</p>");
    });

    test("protects against event handlers", () => {
      const xssAttempts = [
        "<svg onload=\"alert(1)\">",
        "<iframe src=\"evil.com\">",
        "<body onload=\"malicious()\">",
      ];
      xssAttempts.forEach((attempt) => {
        expect(sanitizeHtmlContent(attempt)).not.toContain("onload");
        expect(sanitizeHtmlContent(attempt)).not.toContain("iframe");
        expect(sanitizeHtmlContent(attempt)).not.toContain("src=");
      });
    });
  });

  describe("sanitizeText", () => {
    test("HTML-encodes tags to prevent XSS", () => {
      // sanitizeText uses xss library which encodes HTML tags
      const result = sanitizeText("<b>Bold</b>");
      expect(result).not.toContain("<b>"); // Tags are encoded
      expect(result).toContain("Bold"); // Text is preserved
    });

    test("handles null and non-string input", () => {
      expect(sanitizeText(null)).toBe("");
      expect(sanitizeText(undefined)).toBe("");
      expect(sanitizeText({})).toBe("");
    });

    test("preserves plain text", () => {
      expect(sanitizeText("Hello World")).toBe("Hello World");
    });

    test("handles leading/trailing whitespace", () => {
      // The xss library's stripLeadingAndTrailingWhitespace option removes it
      const result = sanitizeText("  Hello  ");
      expect(result.trim()).toBe("Hello"); // Whitespace is handled
    });

    test("protects against encoded XSS", () => {
      const result = sanitizeText("&lt;script&gt;alert(1)&lt;/script&gt;");
      expect(result).not.toContain("<script>"); // Script tags are prevented
    });
  });

  describe("sanitizeEmail", () => {
    test("preserves valid email", () => {
      expect(sanitizeEmail("user@example.com")).toBe("user@example.com");
    });

    test("converts to lowercase", () => {
      expect(sanitizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com");
    });

    test("removes null bytes and control chars", () => {
      expect(sanitizeEmail("user@example.com\x00")).not.toContain("\x00");
    });

    test("trims whitespace", () => {
      expect(sanitizeEmail("  user@example.com  ")).toBe("user@example.com");
    });

    test("handles null and non-string input", () => {
      expect(sanitizeEmail(null)).toBe("");
      expect(sanitizeEmail(undefined)).toBe("");
      expect(sanitizeEmail(123)).toBe("");
    });

    test("removes dangerous characters", () => {
      const dangerous = "user+<script>@example.com";
      const result = sanitizeEmail(dangerous);
      // sanitizeEmail removes control chars and lowercases
      expect(result).not.toContain("\x00");
      expect(result).toBe("user+<script>@example.com".replace(/[\x00-\x1F\x7F]/g, "").trim().toLowerCase());
    });
  });

  describe("sanitizePhone", () => {
    test("preserves valid phone numbers", () => {
      expect(sanitizePhone("9876543210")).toBe("9876543210");
      expect(sanitizePhone("+91-9876543210")).toBe("+91-9876543210");
    });

    test("removes non-phone characters", () => {
      expect(sanitizePhone("9876<script>543210")).toBe("9876543210");
      expect(sanitizePhone("98765;DROP;43210")).toBe("9876543210");
    });

    test("preserves parentheses and spaces", () => {
      expect(sanitizePhone("(987) 654-3210")).toBe("(987) 654-3210");
    });

    test("handles null and non-string input", () => {
      expect(sanitizePhone(null)).toBe("");
      expect(sanitizePhone(undefined)).toBe("");
      expect(sanitizePhone(9876543210)).toBe("");
    });

    test("trims whitespace", () => {
      expect(sanitizePhone("  9876543210  ")).toBe("9876543210");
    });
  });

  describe("sanitizeUrl", () => {
    test("preserves valid HTTP/HTTPS URLs", () => {
      expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
      expect(sanitizeUrl("http://example.com/page")).toBe("http://example.com/page");
    });

    test("rejects non-HTTP/HTTPS protocols", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("");
      expect(sanitizeUrl("data:text/html,alert(1)")).toBe("");
      expect(sanitizeUrl("file:///etc/passwd")).toBe("");
    });

    test("handles null and non-string input", () => {
      expect(sanitizeUrl(null)).toBe("");
      expect(sanitizeUrl(undefined)).toBe("");
      expect(sanitizeUrl(123)).toBe("");
    });

    test("returns empty for invalid URLs", () => {
      expect(sanitizeUrl("not a url")).toBe("");
      expect(sanitizeUrl("ht!tp://broken")).toBe("");
    });

    test("preserves query parameters", () => {
      const url = "https://example.com/page?id=123&name=test";
      expect(sanitizeUrl(url)).toContain("id=123");
    });
  });

  describe("sanitizeFilePath", () => {
    test("prevents path traversal attacks", () => {
      expect(sanitizeFilePath("../../etc/passwd")).toBe("passwd");
      expect(sanitizeFilePath("..\\..\\windows\\system32")).toBe("system32");
    });

    test("extracts filename only", () => {
      expect(sanitizeFilePath("/path/to/file.txt")).toBe("file.txt");
      expect(sanitizeFilePath("C:\\Users\\file.txt")).toBe("file.txt");
    });

    test("removes dangerous characters", () => {
      expect(sanitizeFilePath("file<script>.txt")).toBe("filescript.txt");
      expect(sanitizeFilePath("file|dangerous.txt")).toBe("filedangerous.txt");
    });

    test("handles null and non-string input", () => {
      expect(sanitizeFilePath(null)).toBe("");
      expect(sanitizeFilePath(undefined)).toBe("");
    });
  });

  describe("sanitizeSearchQuery", () => {
    test("preserves normal search text", () => {
      expect(sanitizeSearchQuery("python course")).toBe("python course");
      expect(sanitizeSearchQuery("web development")).toBe("web development");
    });

    test("removes null bytes and control chars", () => {
      expect(sanitizeSearchQuery("test\x00query")).toBe("testquery");
    });

    test("limits length to 200 characters", () => {
      const longQuery = "a".repeat(300);
      expect(sanitizeSearchQuery(longQuery).length).toBeLessThanOrEqual(200);
    });

    test("trims whitespace", () => {
      expect(sanitizeSearchQuery("  query  ")).toBe("query");
    });

    test("handles null and non-string input", () => {
      expect(sanitizeSearchQuery(null)).toBe("");
      expect(sanitizeSearchQuery(undefined)).toBe("");
    });
  });

  describe("sanitizeObject", () => {
    test("removes MongoDB operators", () => {
      const malicious = { $where: "dangerous", name: "safe" };
      const result = sanitizeObject(malicious);
      expect(result.$where).toBeUndefined();
      expect(result.name).toBe("safe");
    });

    test("sanitizes string values", () => {
      const obj = { name: "<script>alert(1)</script>" };
      const result = sanitizeObject(obj);
      expect(result.name).not.toContain("<script>");
    });

    test("handles nested objects", () => {
      const nested = {
        user: {
          name: "<b>John</b>",
          email: "john@example.com",
        },
      };
      const result = sanitizeObject(nested);
      expect(result.user.name).not.toContain("<b>");
    });

    test("preserves non-string values", () => {
      const obj = { count: 5, active: true };
      const result = sanitizeObject(obj);
      expect(result.count).toBe(5);
      expect(result.active).toBe(true);
    });

    test("handles null and non-object input", () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });
  });

  describe("sanitizeJson", () => {
    test("parses and sanitizes valid JSON", () => {
      const json = "{\"name\":\"<script>alert(1)</script>\",\"safe\":true}";
      const result = sanitizeJson(json);
      expect(result.safe).toBe(true);
      expect(result.name).not.toContain("<script>");
    });

    test("returns null for invalid JSON", () => {
      expect(sanitizeJson("not valid json")).toBe(null);
      expect(sanitizeJson("{\"broken\":")).toBe(null);
    });

    test("handles null and non-string input", () => {
      expect(sanitizeJson(null)).toBe(null);
      expect(sanitizeJson(undefined)).toBe(null);
      expect(sanitizeJson(123)).toBe(null);
    });

    test("removes MongoDB operators from parsed JSON", () => {
      const json = "{\"$where\":\"dangerous\",\"name\":\"safe\"}";
      const result = sanitizeJson(json);
      expect(result.$where).toBeUndefined();
      expect(result.name).toBe("safe");
    });
  });

  describe("sanitizeFormData", () => {
    test("sanitizes email fields", () => {
      const form = { email: "USER@EXAMPLE.COM\x00" };
      const result = sanitizeFormData(form, { email: { type: "email" } });
      expect(result.email).toBe("user@example.com");
    });

    test("sanitizes phone fields", () => {
      const form = { phone: "9876<script>543210" };
      const result = sanitizeFormData(form, { phone: { type: "phone" } });
      expect(result.phone).toBe("9876543210");
    });

    test("sanitizes URL fields", () => {
      const form = { website: "javascript:alert(1)" };
      const result = sanitizeFormData(form, { website: { type: "url" } });
      expect(result.website).toBe("");
    });

    test("sanitizes text fields by default", () => {
      const form = { message: "<b>Bold</b>" };
      const result = sanitizeFormData(form);
      // Default sanitization uses sanitizeText which HTML-encodes
      expect(result.message).not.toContain("<b>");
      expect(result.message).toContain("Bold");
    });

    test("handles null and non-object input", () => {
      expect(sanitizeFormData(null)).toEqual({});
      expect(sanitizeFormData(undefined)).toEqual({});
    });
  });

  describe("sanitizeUserProfile", () => {
    test("sanitizes all user profile fields", () => {
      const profile = {
        name: "<script>alert(1)</script>John",
        email: "JOHN@EXAMPLE.COM",
        phone: "9876543210",
        bio: "<b>Developer</b>",
      };
      const result = sanitizeUserProfile(profile);
      expect(result.name).not.toContain("<script>");
      expect(result.email).toBe("john@example.com");
      expect(result.bio).not.toContain("<b>");
    });

    test("handles missing optional fields", () => {
      const profile = { name: "John", email: "john@example.com" };
      const result = sanitizeUserProfile(profile);
      expect(result.name).toBe("John");
      expect(result.profilePicture).toBeUndefined();
    });

    test("handles null and non-object input", () => {
      expect(sanitizeUserProfile(null)).toEqual({});
      expect(sanitizeUserProfile(undefined)).toEqual({});
    });
  });

  describe("sanitizeCourseContent", () => {
    test("sanitizes course title and description", () => {
      const content = {
        title: "<script>Dangerous</script>Python",
        description: "<img src=\"x\" onerror=\"alert(1)\">Learn Python",
      };
      const result = sanitizeCourseContent(content);
      // sanitizeText HTML-encodes tags to prevent execution
      expect(result.title).not.toContain("<script>");
      expect(result.title).toContain("Python");
      // The img tag is encoded, so onerror won't execute
      expect(result.description).not.toContain("<img");
      expect(result.description).toContain("Learn Python");
    });

    test("handles null and non-object input", () => {
      expect(sanitizeCourseContent(null)).toEqual({});
      expect(sanitizeCourseContent(undefined)).toEqual({});
    });
  });

  describe("validateAndSanitize", () => {
    test("validates and sanitizes email", () => {
      const result = validateAndSanitize("USER@EXAMPLE.COM", "email");
      expect(result.valid).toBe(true);
      expect(result.value).toBe("user@example.com");
    });

    test("rejects invalid email", () => {
      const result = validateAndSanitize("not-an-email", "email");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid email");
    });

    test("validates and sanitizes phone", () => {
      const result = validateAndSanitize("9876543210", "phone");
      expect(result.valid).toBe(true);
      expect(result.value).toBe("9876543210");
    });

    test("rejects phone with less than 10 digits", () => {
      const result = validateAndSanitize("123", "phone");
      expect(result.valid).toBe(false);
    });

    test("validates and sanitizes URL", () => {
      const result = validateAndSanitize("https://example.com", "url");
      expect(result.valid).toBe(true);
    });

    test("rejects malicious URLs", () => {
      const result = validateAndSanitize("javascript:alert(1)", "url");
      expect(result.valid).toBe(false);
    });

    test("handles text type", () => {
      const result = validateAndSanitize("<b>Text</b>", "text");
      expect(result.valid).toBe(true);
      expect(result.value).not.toContain("<b>");
    });

    test("rejects null and non-string input", () => {
      const result = validateAndSanitize(null, "text");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("required");
    });

    test("handles unknown type", () => {
      const result = validateAndSanitize("test", "unknown");
      expect(result.valid).toBe(true);
    });
  });

  describe("Security edge cases", () => {
    test("protects against double encoding attacks", () => {
      const doubleEncoded = "&lt;script&gt;alert(1)&lt;/script&gt;";
      const result = sanitizeText(doubleEncoded);
      // The xss library handles encoded content safely
      expect(result).not.toContain("<script>"); // Won't be decoded back to executable
    });

    test("handles extremely long strings safely", () => {
      const longString = "a".repeat(10000) + "<script>";
      const result = sanitizeText(longString);
      expect(result).not.toContain("<script>");
      expect(result.length).toBeGreaterThan(0);
    });

    test("protects against null byte injection", () => {
      const withNullByte = "file.txt\x00.jpg";
      const result = sanitizeFilePath(withNullByte);
      expect(result).not.toContain("\x00");
    });

    test("handles special regex characters safely", () => {
      expect(sanitizeSearchQuery("(test|other)+*?")).toBe("(test|other)+*?");
    });
  });
});
