import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../../Controllers/Evet-Controller/event.controller.js";

const router = express.Router();

// ------------------------
// Routes
// ------------------------
router.post("/", asyncHandler(createEvent));
router.get("/", asyncHandler(getAllEvents));
router.get("/:id", asyncHandler(getEventById));
router.put("/:id", asyncHandler(updateEvent));
router.delete("/:id", asyncHandler(deleteEvent));

export default router;
