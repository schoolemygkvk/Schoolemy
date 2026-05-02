// SECURITY CHECKLIST: Security headers and CORS configuration
import helmet from "helmet";
import cors from "cors";


export const setupSecurityHeaders = (app) => {
  // Helmet provides various HTTP headers for security
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }));

  logger.info("✓ Security headers configured");
};


export const setupCORS = (app) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://yourdomain.com",
    // Add other trusted domains here
  ];

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS rejected request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 3600, // 1 hour
  };

  app.use(cors(corsOptions));
  logger.info("✓ CORS configured for secure cross-origin requests");
};


export const setupGlobalRateLimit = (app, rateLimit) => {
  // General API rate limit: 100 requests per 15 minutes per IP
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", generalLimiter);
  logger.info("✓ Global rate limiting configured");
};


export const setupInputValidation = (app, mongoSanitize) => {
  // Sanitize data against NoSQL injection
  app.use(mongoSanitize());

  logger.info("✓ Input sanitization configured");
};

export default {
  setupSecurityHeaders,
  setupCORS,
  setupGlobalRateLimit,
  setupInputValidation,
};
