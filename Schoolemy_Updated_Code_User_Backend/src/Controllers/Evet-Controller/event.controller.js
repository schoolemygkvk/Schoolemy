import  logger  from  "../../Utils/logger.js";

import Event from "../../Models/Event-Model/event-model.js";

// ------------------------
// Create Event
// Expect coverImages as array of image URLs (e.g. S3 links)
// ------------------------
export const createEvent = async (req, res) => {
  try {
    const body = req.body;

    let coverImages = body.coverImages || [];

    // Normalize single string / comma-separated string to array
    if (typeof coverImages === "string") {
      try {
        // Try parse JSON stringified array first
        const parsed = JSON.parse(coverImages);
        coverImages = Array.isArray(parsed) ? parsed : [coverImages];
      } catch {
        coverImages = coverImages
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      }
    }

    const newEvent = await Event.create({
      ...body,
      coverImages,
    });

    return res.status(201).json({
      status: true,
      message: "Event created successfully",
      data: newEvent,
    });
  } catch (error) {
    logger.debug("Create Event Error:", error);
    return res.status(500).json({ status: false, error: error.message });
  }
};

// ------------------------
// Get All Events with pagination & filters
// Returns coverImages as stored (S3 URLs)
// ------------------------
export const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, search } = req.query;

    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (search) query.eventName = { $regex: search, $options: "i" };

    const events = await Event.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Event.countDocuments(query);

    return res.status(200).json({
      status: true,
      data: events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.debug("Get Events Error:", error);
    return res.status(500).json({ status: false, error: error.message });
  }
};

// ------------------------
// Get Single Event by ID
// Returns coverImages as stored (S3 URLs)
// ------------------------
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const excludeImages = req.query.excludeImages === "1";

    const event = await Event.findById(id);
    if (!event)
      return res
        .status(404)
        .json({ status: false, message: "Event not found" });

    const eventData = event.toObject();

    if (excludeImages) {
      eventData.coverImages = [];
    }

    return res.status(200).json({ status: true, data: eventData });
  } catch (error) {
    logger.debug("Get Event Error:", error);
    return res.status(500).json({ status: false, error: error.message });
  }
};

// ------------------------
// Update Event
// Accept coverImages as array / string of S3 URLs
// ------------------------
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updateData = { ...body };

    if (body.coverImages !== undefined) {
      let coverImages = body.coverImages;

      if (typeof coverImages === "string") {
        try {
          const parsed = JSON.parse(coverImages);
          coverImages = Array.isArray(parsed) ? parsed : [coverImages];
        } catch {
          coverImages = coverImages
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
        }
      }

      updateData.coverImages = coverImages;
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedEvent)
      return res.status(404).json({ status: false, message: "Event not found" });

    return res.status(200).json({
      status: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    logger.debug("Update Event Error:", error);
    return res.status(500).json({ status: false, error: error.message });
  }
};

// ------------------------
// Delete Event
// ------------------------
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent)
      return res.status(404).json({ status: false, message: "Event not found" });

    return res.status(200).json({
      status: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    logger.debug("Delete Event Error:", error);
    return res.status(500).json({ status: false, error: error.message });
  }
};
