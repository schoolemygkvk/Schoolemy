// routes/courseRoutes.js
import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import { getPurchasedCoursesByUser } from "../../Controllers/Purchased-courses/purchasedcourse-controller.js";

const router = express.Router();

router.get("/user/purchased-courses/:userId", asyncHandler(getPurchasedCoursesByUser));

export default router;
