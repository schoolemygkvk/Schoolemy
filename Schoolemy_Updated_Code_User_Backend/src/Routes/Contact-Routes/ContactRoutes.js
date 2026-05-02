import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import { sendContactEmail } from "../../Controllers/ContactController.js";

const router = express.Router();

// POST /contact
router.post("/contact", asyncHandler(sendContactEmail));

export default router;