import Meeting from '../../Models/BOS/bos-Meeting.js';
import Notification from '../../Models/Notification-Model/Notification-model.js'; 
import { sendMeetingEmail } from '../../Notification/Bos-Email.js';
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

export async function createMeeting(req, res) {
  try {
    const { title, date, time, participants } = req.body;

    // Validate required fields
    if (!title || !date || !time || !participants) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate meeting ID
    const currentYear = new Date().getFullYear();
    const latestMeeting = await Meeting.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextMeetingNumber = 1;
    
    if (latestMeeting && latestMeeting.meeting_id) {
      const lastMeetingNumber = parseInt(latestMeeting.meeting_id.split('-M')[1]);
      nextMeetingNumber = lastMeetingNumber + 1;
    }

    const meeting_id = `BOS${currentYear}-M${nextMeetingNumber.toString().padStart(3, '0')}`;
    req.body.meeting_id = meeting_id;

    // Validate participants as email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of participants) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: `Invalid participant email: ${email}` });
      }
    }

    // Save meeting
    const meeting = new Meeting(req.body);
    await meeting.save();

    // Create a notification
    const notification = new Notification({
      title: 'New BOS Meeting Scheduled',
      message: `Meeting titled "${title}" is scheduled on ${new Date(date).toLocaleDateString()} at ${time}.`,
      recipientRoles: ['superadmin','bosmembers', 'boscontroller'],
       meetingId: meeting._id,
    });
    await notification.save();

    // Invitation email uses Nodemailer + Gmail (Bos-Email.js). Missing/wrong env should not fail the API after the meeting is saved.
    const emailConfigured =
      Boolean(process.env.EMAIL_ADMIN?.trim()) && Boolean(process.env.EMAIL_PASS?.trim());
    const emailStatus = { sent: false };

    if (emailConfigured) {
      try {
        await sendMeetingEmail(participants, meeting);
        emailStatus.sent = true;
      } catch (emailErr) {
        console.error("BOS createMeeting: invitation email failed:", emailErr);
        emailStatus.error = emailErr.message;
      }
    } else {
      console.warn(
        "BOS createMeeting: EMAIL_ADMIN / EMAIL_PASS not set; skipping invitation email."
      );
      emailStatus.skippedReason = "Email credentials not configured";
    }

    const message = emailStatus.sent
      ? "Meeting created successfully and emails sent to participants"
      : emailStatus.error
      ? `Meeting created successfully, but invitation email failed: ${emailStatus.error}`
      : "Meeting created successfully. Invitation email was not sent (configure EMAIL_ADMIN and EMAIL_PASS to enable).";

    res.status(201).json({
      message,
      data: meeting,
      emailStatus,
    });
  } catch (error) {
    res.status(400).json({
      message: 'Error creating meeting',
      error: error.message,
    });
  }
}

export const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return sendError(res, 404, "Meeting not found");
    }

    res.status(200).json({ message: 'Meeting fetched successfully', data: meeting });
  } catch (error) {
    sendError(res, 500, "Error fetching meeting", { details: error.message });
  }
};

export const getAllMeetings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [meetings, total] = await Promise.all([
      Meeting.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Meeting.countDocuments(query)
    ]);

    sendPaginated(res, meetings, total, page, limit, "Items retrieved");
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch meetings", error: error.message });
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const { meeting_id } = req.params;
    const updateData = req.body;

    const meeting = await Meeting.findByIdAndUpdate(meeting_id, updateData, { new: true, runValidators: true });
    if (!meeting) return sendError(res, 404, "Meeting not found");

    sendSuccess(res, 200, "Meeting updated", meeting);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update meeting", error: error.message });
  }
};

export const deleteMeeting = async (req, res) => {
  try {
    const { meeting_id } = req.params;

    const meeting = await Meeting.findByIdAndDelete(meeting_id);
    if (!meeting) return sendError(res, 404, "Meeting not found");

    res.status(200).json({ success: true, message: "Meeting deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete meeting", error: error.message });
  }
};