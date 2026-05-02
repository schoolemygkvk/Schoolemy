// File: user-backend/src/Routes/NotificationBell/joinRequestRoutes.js

import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
const router = express.Router();

import { submitJoinRequest } from "../../Controllers/NotificationBell/JoinRequestController.js";

// Intha route-ku POST request varum bodhu, controller function-a koopdum
// Security (verifyToken) server.js-laye handle aaguradhala inga theva illa.
router.post("/submit", asyncHandler(submitJoinRequest));

export default router;