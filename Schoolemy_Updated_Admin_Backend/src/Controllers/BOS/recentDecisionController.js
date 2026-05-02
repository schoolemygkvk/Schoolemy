import RecentDecision from '../../Models/BOS/RecentDecision.js';
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Controller to handle posting a new decision
export async function createDecision(req, res) {
  try {
    const { decisionTitle, decisionDetails, createdBy } = req.body;

    // Check if required fields are present
    if (!decisionTitle || !decisionDetails || !createdBy) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Generate a unique decision ID (format: DEC-YYYYMMDD-XXXXX)
    const date = new Date();
    const dateString = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0');
    const randomString = Math.random().toString(36).substring(2, 7).toUpperCase();
    const decision_id = `DEC-${dateString}-${randomString}`;

    // Create a new decision document
    const newDecision = new RecentDecision({
      decision_id,
      decisionTitle,
      decisionDetails,
      createdBy
    });

    // Save to DB
    await newDecision.save();

    res.status(201).json({ message: 'Decision created successfully', data: newDecision });
  } catch (error) {
    console.error('Error creating decision:', error.message);
    sendError(res, 500, "Failed creating decision", { details: error.message });
  }
}

// Controller to handle fetching all decisions
export async function getAllDecisions(req, res) {
  try {
    const decisions = await RecentDecision.find().sort({ decisionDate: -1 }); // Sort by newest first
    res.status(200).json({ data: decisions });
  } catch (error) {
    console.error('Error fetching decisions:', error.message);
    sendError(res, 500, "Failed fetching decisions", { details: error.message });
  }
}

// Controller to approve or reject a decision (COT only)
export async function updateDecisionStatus(req, res) {
  try {
    const { status, comments } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    let decision = await RecentDecision.findOneAndUpdate(
      { decision_id: req.params.id },
      { status, comments },
      { new: true }
    );

    if (!decision) {
      decision = await RecentDecision.findByIdAndUpdate(
        req.params.id,
        { status, comments },
        { new: true }
      );
    }

    if (!decision) {
      return sendError(res, 404, "Decision not found");
    }

    res.status(200).json({ message: `Decision ${status} successfully`, data: decision });
  } catch (error) {
    console.error('Error updating decision status:', error.message);
    sendError(res, 500, "Failed updating decision status", { details: error.message });
  }
}
