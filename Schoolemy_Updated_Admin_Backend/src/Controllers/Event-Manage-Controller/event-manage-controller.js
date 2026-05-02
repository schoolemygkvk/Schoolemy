import EventManageModel from "../../Models/Event-Manage-Model/event-manage-model.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../DB/adudios3.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

const isHttpsUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s.trim());

// Direct client upload already stored in S3 — persist URL only
const normalizeCoverUrl = (img) => {
  if (typeof img !== "string" || !img.trim()) return null;
  const trimmed = img.trim();
  if (isHttpsUrl(trimmed)) return trimmed;
  return null;
};

// Delete file from S3
const deleteFileFromS3 = async (s3UrlOrKey) => {
  const STAFF_BUCKET = process.env.AWS_S3_STAFF_BUCKET || process.env.AWS_BUCKET_NAME;

  if (!s3UrlOrKey || !STAFF_BUCKET) return;

  let key;
  if (s3UrlOrKey.startsWith("http")) {
    try {
      const url = new URL(s3UrlOrKey);
      key = decodeURIComponent(url.pathname.substring(1));
    } catch {
      return;
    }
  } else {
    key = s3UrlOrKey;
  }

  const command = new DeleteObjectCommand({ Bucket: STAFF_BUCKET, Key: key });
  await s3.send(command);
};

// Create Event
export const createEvent = async (req, res) => {
  try {
    const { coverImages, ...rest } = req.body;

    let coverImageUrls = [];
    if (coverImages?.length) {
      for (const img of coverImages) {
        if (typeof img === "string") {
          const url = normalizeCoverUrl(img);
          if (!url) {
            return res.status(400).json({
              success: false,
              message: "Invalid cover image URL. Please upload image to S3 first.",
            });
          }
          coverImageUrls.push(url);
        }
      }
    }

    const newEvent = new EventManageModel({
      ...rest,
      coverImages: coverImageUrls
    });

    await newEvent.save();
    sendSuccess(res, 201, "Created successfully", newEvent
    );
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Events with Pagination
export const getAllEvents = async (req, res) => {
  try {
    // Parse pagination query params (default page=1, limit=10)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Optional filters (you can extend later)
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    // Fetch paginated events
    const [events, total] = await Promise.all([
      EventManageModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      EventManageModel.countDocuments(filter)
    ]);

    // Handle empty case
    if (!events || events.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Empty - No events found",
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      });
    }

    // Response with pagination info
    res.status(200).json({
      success: true,
      message: "Events retrieved successfully",
      count: events.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Event by eventId
export const getEventById = async (req, res) => {
  try {
    const event = await EventManageModel.findOne({ eventId: req.params.eventId });
    if (!event)
      return sendError(res, 404, "Event not found");
    sendSuccess(res, 200, "Success", event );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Events by Status (Upcoming / Ongoing / Completed)
export const getEventsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["Upcoming", "Ongoing", "Completed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Use one of: ${validStatuses.join(", ")}`
      });
    }

    const events = await EventManageModel.find({ status }).sort({ date: 1 });

    if (!events || events.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No ${status.toLowerCase()} events found`,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      message: `${status} events retrieved successfully`,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




export const updateEvent = async (req, res) => {
  try {
    const { coverImages, ...rest } = req.body;
    const updateData = { ...rest };

    const existingEvent = await EventManageModel.findOne({ eventId: req.params.eventId });
    if (!existingEvent)
      return sendError(res, 404, "Event not found");

    if (coverImages !== undefined) {
      // Delete old cover images from S3 when updating
      if (existingEvent.coverImages?.length) {
        for (const url of existingEvent.coverImages) {
          if (url?.startsWith?.("http")) {
            try {
              await deleteFileFromS3(url);
            } catch (delErr) {
              console.warn("Could not delete old event cover from S3:", delErr.message);
            }
          }
        }
      }

      // URL-only flow: accept direct-uploaded S3/HTTPS URLs only
      const coverImageUrls = [];
      if (Array.isArray(coverImages)) {
        for (const img of coverImages) {
          if (typeof img === "string") {
            const url = normalizeCoverUrl(img);
            if (!url) {
              return res.status(400).json({
                success: false,
                message: "Invalid cover image URL. Please upload image to S3 first.",
              });
            }
            coverImageUrls.push(url);
          }
        }
      }
      updateData.coverImages = coverImageUrls;
    }

    const updated = await EventManageModel.findOneAndUpdate(
      { eventId: req.params.eventId },
      updateData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const existingEvent = await EventManageModel.findOne({ eventId: req.params.eventId });
    if (!existingEvent)
      return sendError(res, 404, "Event not found");

    // Delete cover images from S3
    if (existingEvent.coverImages?.length) {
      for (const url of existingEvent.coverImages) {
        if (url?.startsWith?.("http")) {
          try {
            await deleteFileFromS3(url);
          } catch (delErr) {
            console.warn("Could not delete event cover from S3:", delErr.message);
          }
        }
      }
    }

    const deleted = await EventManageModel.findOneAndDelete({
      eventId: req.params.eventId
    });

    res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
