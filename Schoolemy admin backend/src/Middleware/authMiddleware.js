import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const verifyToken = async (req, res, next) => {
  try {
    const PATH = req.path;

    // Allow public routes without token
    const publicPaths = [
      "/adminlogin",
      "/verify-otp",
      "/forgot-password",
      "/reset-password",
      "/api/blog/published",
      "/api/blog/search",
      "/api/blog/admin/all",
      "/api/announcements/latest",
      "/api/my-materials"
    ];

    // Check exact match for public paths
    if (publicPaths.includes(PATH)) {
      return next();
    }

    // Advertisement - public for users to get active ad without login
    if (PATH === "/api/advertisements/active") {
      return next();
    }

    // Check pattern match for dynamic routes (materials access)
    if (PATH.startsWith("/api/course-meets/materials/s3/")) {
      return next();
    }

    // Check pattern match for public meets access
    if (PATH.startsWith("/api/course-meets/meets/")) {
      return next();
    }

    const authorization = req.headers["authorization"];
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header not found" });
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token not found" });
    }

    // ✅ Decode and verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token has expired" });
    }
    return res
      .status(403)
      .json({ message: "Token verification failed", error: error.message });
  }
};

export { verifyToken };
