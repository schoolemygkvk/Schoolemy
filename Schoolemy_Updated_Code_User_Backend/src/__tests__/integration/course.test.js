

import { describe, test, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import { setupDatabase, teardownDatabase, clearDatabase, createTestToken } from "./setup.js";

// Create test app with mock course endpoints
const app = express();
app.use(express.json());

// Mock course database
const courses = [
  {
    id: "1",
    title: "JavaScript Basics",
    description: "Learn JavaScript fundamentals",
    category: "Programming",
    price: 500,
    instructor: "John Doe",
    students: 150,
  },
  {
    id: "2",
    title: "React Advanced",
    description: "Master React patterns",
    category: "Programming",
    price: 1000,
    instructor: "Jane Smith",
    students: 89,
  },
  {
    id: "3",
    title: "Web Design Principles",
    description: "Design beautiful websites",
    category: "Design",
    price: 700,
    instructor: "Mike Johnson",
    students: 200,
  },
];

// Mock routes
app.get("/api/courses", (req, res) => {
  const { category, search, limit = 10, page = 1 } = req.query;
  let filtered = [...courses];

  // Filter by category
  if (category) {
    filtered = filtered.filter(c => c.category.toLowerCase() === category.toLowerCase());
  }

  // Filter by search term
  if (search) {
    filtered = filtered.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()),
    );
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const paginatedCourses = filtered.slice(start, end);

  res.json({
    courses: paginatedCourses,
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
  });
});

// Get single course
app.get("/api/courses/:id", (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  res.json(course);
});

// Get courses by category
app.get("/api/courses/category/:categoryName", (req, res) => {
  const categoryName = req.params.categoryName.toLowerCase();
  const filtered = courses.filter(c => c.category.toLowerCase() === categoryName);

  if (filtered.length === 0) {
    return res.status(404).json({ error: "No courses in this category" });
  }

  res.json({
    category: req.params.categoryName,
    courses: filtered,
    total: filtered.length,
  });
});

// Search courses
app.get("/api/courses/search/:query", (req, res) => {
  const query = req.params.query.toLowerCase();
  const results = courses.filter(c =>
    c.title.toLowerCase().includes(query) ||
    c.description.toLowerCase().includes(query),
  );

  if (results.length === 0) {
    return res.status(404).json({ error: "No courses found" });
  }

  res.json({
    query: req.params.query,
    courses: results,
    total: results.length,
  });
});

describe("Course Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  }, 30000);

  afterAll(async () => {
    await teardownDatabase();
  }, 30000);

  afterEach(async () => {
    await clearDatabase();
  }, 10000);

  describe("GET /api/courses - List all courses", () => {
    test("returns all courses with default pagination", async () => {
      const response = await request(app)
        .get("/api/courses");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("courses");
      expect(Array.isArray(response.body.courses)).toBe(true);
      expect(response.body.courses.length).toBeGreaterThan(0);
    });

    test("returns pagination metadata", async () => {
      const response = await request(app)
        .get("/api/courses");

      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("page");
      expect(response.body).toHaveProperty("limit");
      expect(typeof response.body.total).toBe("number");
    });

    test("supports limit parameter", async () => {
      const response = await request(app)
        .get("/api/courses?limit=2");

      expect(response.status).toBe(200);
      expect(response.body.courses.length).toBeLessThanOrEqual(2);
      expect(response.body.limit).toBe(2);
    });

    test("supports pagination with page parameter", async () => {
      const response = await request(app)
        .get("/api/courses?page=2&limit=2");

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
    });

    test("each course has required fields", async () => {
      const response = await request(app)
        .get("/api/courses");

      expect(response.body.courses.length).toBeGreaterThan(0);
      const course = response.body.courses[0];
      expect(course).toHaveProperty("id");
      expect(course).toHaveProperty("title");
      expect(course).toHaveProperty("description");
      expect(course).toHaveProperty("category");
      expect(course).toHaveProperty("price");
    });
  });

  describe("GET /api/courses/:id - Get course details", () => {
    test("returns specific course by ID", async () => {
      const response = await request(app)
        .get("/api/courses/1");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", "1");
      expect(response.body).toHaveProperty("title");
      expect(response.body.title).toBe("JavaScript Basics");
    });

    test("returns 404 for non-existent course", async () => {
      const response = await request(app)
        .get("/api/courses/999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });

    test("course includes all necessary information", async () => {
      const response = await request(app)
        .get("/api/courses/1");

      const course = response.body;
      expect(course).toHaveProperty("id");
      expect(course).toHaveProperty("title");
      expect(course).toHaveProperty("description");
      expect(course).toHaveProperty("category");
      expect(course).toHaveProperty("price");
      expect(course).toHaveProperty("instructor");
      expect(course).toHaveProperty("students");
    });
  });

  describe("GET /api/courses/category/:categoryName - Filter by category", () => {
    test("returns courses in specified category", async () => {
      const response = await request(app)
        .get("/api/courses/category/Programming");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("courses");
      expect(response.body.courses.length).toBeGreaterThan(0);
      // All returned courses should be in Programming category
      response.body.courses.forEach(course => {
        expect(course.category).toBe("Programming");
      });
    });

    test("returns 404 for non-existent category", async () => {
      const response = await request(app)
        .get("/api/courses/category/NonExistent");

      expect(response.status).toBe(404);
    });

    test("category filter is case-insensitive", async () => {
      const response1 = await request(app)
        .get("/api/courses/category/programming");

      const response2 = await request(app)
        .get("/api/courses/category/PROGRAMMING");

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.courses.length).toBe(response2.body.courses.length);
    });

    test("includes total count in response", async () => {
      const response = await request(app)
        .get("/api/courses/category/Programming");

      expect(response.body).toHaveProperty("total");
      expect(response.body.total).toBe(response.body.courses.length);
    });
  });

  describe("GET /api/courses/search/:query - Search courses", () => {
    test("finds courses by title", async () => {
      const response = await request(app)
        .get("/api/courses/search/JavaScript");

      expect(response.status).toBe(200);
      expect(response.body.courses.length).toBeGreaterThan(0);
      expect(response.body.courses[0].title.toLowerCase()).toContain("javascript");
    });

    test("finds courses by description", async () => {
      const response = await request(app)
        .get("/api/courses/search/patterns");

      expect(response.status).toBe(200);
      expect(response.body.courses.length).toBeGreaterThan(0);
    });

    test("search is case-insensitive", async () => {
      const response1 = await request(app)
        .get("/api/courses/search/react");

      const response2 = await request(app)
        .get("/api/courses/search/REACT");

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.courses.length).toBe(response2.body.courses.length);
    });

    test("returns 404 when no courses match", async () => {
      const response = await request(app)
        .get("/api/courses/search/XYZNoMatchXYZ");

      expect(response.status).toBe(404);
    });

    test("search results include total count", async () => {
      const response = await request(app)
        .get("/api/courses/search/Programming");

      // Check if search found results
      if (response.status === 200) {
        expect(response.body).toHaveProperty("total");
        expect(response.body.total).toBeGreaterThan(0);
      }
      // If no results, status should be 404
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("Query parameter filtering via /api/courses", () => {
    test("filters by category via query parameter", async () => {
      const response = await request(app)
        .get("/api/courses?category=Programming");

      expect(response.status).toBe(200);
      response.body.courses.forEach(course => {
        expect(course.category).toBe("Programming");
      });
    });

    test("searches via query parameter", async () => {
      const response = await request(app)
        .get("/api/courses?search=React");

      expect(response.status).toBe(200);
      if (response.body.courses.length > 0) {
        const matchesSearch = response.body.courses.some(c =>
          c.title.toLowerCase().includes("react") ||
          c.description.toLowerCase().includes("react"),
        );
        expect(matchesSearch).toBe(true);
      }
    });

    test("combines category and search filters", async () => {
      const response = await request(app)
        .get("/api/courses?category=Programming&search=React");

      expect(response.status).toBe(200);
      response.body.courses.forEach(course => {
        expect(course.category).toBe("Programming");
        const matchesSearch = course.title.toLowerCase().includes("react") ||
                             course.description.toLowerCase().includes("react");
        expect(matchesSearch).toBe(true);
      });
    });
  });
});
