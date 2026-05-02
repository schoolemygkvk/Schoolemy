import express from "express";
import asyncHandler from "../Utils/asyncHandler.js";
import { sendCourseCompletionCertificate } from "../Controllers/Certificate-Controller.js";

const router = express.Router();

router.post("/send-completion", asyncHandler(sendCourseCompletionCertificate));

export default router;
