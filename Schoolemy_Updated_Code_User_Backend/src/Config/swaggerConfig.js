

const swaggerConfig = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Schoolemy API",
      version: "1.0.0",
      description: "Complete REST API for Schoolemy online learning platform",
      contact: {
        name: "Schoolemy Team",
        email: "support@schoolemy.com",
        url: "https://schoolemy.com",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:8000",
        description: process.env.NODE_ENV === "production" ? "Production Server" : "Development Server",
      },
      {
        url: "http://localhost:8000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from /login endpoint. Include in Authorization header as: Bearer <token>",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "sessionId",
          description: "Session cookie for authenticated requests",
        },
      },
      schemas: {
        // User Schema
        User: {
          type: "object",
          properties: {
            id: { type: "string", description: "User unique identifier (MongoDB ObjectId)" },
            email: { type: "string", format: "email", description: "User email address" },
            name: { type: "string", description: "User full name" },
            phone: { type: "string", description: "User phone number" },
            age: { type: "integer", description: "User age" },
            gender: { type: "string", enum: ["male", "female", "other"], description: "User gender" },
            profilePicture: { type: "string", description: "URL to profile picture" },
            bio: { type: "string", description: "User biography" },
            createdAt: { type: "string", format: "date-time", description: "Account creation timestamp" },
            updatedAt: { type: "string", format: "date-time", description: "Last update timestamp" },
          },
          required: ["id", "email", "name"],
        },

        // Authentication Response
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            token: { type: "string", description: "JWT authentication token" },
            refreshToken: { type: "string", description: "Refresh token for obtaining new JWT" },
            user: { $ref: "#/components/schemas/User" },
            csrfToken: { type: "string", description: "CSRF token for state-changing requests" },
          },
        },

        // Course Schema
        Course: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            instructor: { type: "string", description: "Instructor name" },
            price: { type: "number", format: "float" },
            discountPrice: { type: "number", format: "float" },
            category: { type: "string" },
            level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
            duration: { type: "string", description: "Course duration (e.g., \"8 weeks\")" },
            students: { type: "integer", description: "Number of enrolled students" },
            rating: { type: "number", format: "float", minimum: 0, maximum: 5 },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // Payment Response
        PaymentResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            paymentId: { type: "string" },
            orderId: { type: "string" },
            amount: { type: "number", format: "float" },
            status: { type: "string", enum: ["pending", "success", "failed"] },
            timestamp: { type: "string", format: "date-time" },
          },
        },

        // Error Response
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", default: false },
            message: { type: "string", description: "User-friendly error message" },
            code: { type: "string", description: "Error code for debugging" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                  value: {},
                },
              },
              description: "Validation errors (if applicable)",
            },
            timestamp: { type: "string", format: "date-time" },
            path: { type: "string", description: "Request path that caused error" },
          },
        },

        // Rate Limit Response
        RateLimitResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", default: false },
            message: { type: "string", description: "Rate limit exceeded message" },
            code: { type: "string", enum: ["RATE_LIMIT_EXCEEDED"] },
            retryAfter: { type: "integer", description: "Seconds until next attempt allowed" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: [
    "./src/Routes/users-routes/User-Routes.js",
    "./src/Routes/Course-routes/Course-routes.js",
    "./src/Routes/Payment-Routes/Payment-Routes.js",
    "./src/Routes/Purchased-routes/Purchased-routs.js",
    "./src/swagger-docs/**/*.js",
  ],
};

export default swaggerConfig;
