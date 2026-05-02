import DirectMeetFees from '../../Models/Data-Maintenance/DirectMeetFees.js';
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Create Direct Meet Fee Record
export const createDirectMeetFee = async (req, res) => {
  try {
    const { studentID, name, gender, amount, paymentType, course } = req.body;

    // Validate required fields
    if (!studentID || !name || !gender || !amount || !paymentType || !course) {
      return sendError(res, 400, "All fields are required");
    }

    // Validate gender
    if (!['Male', 'Female', 'Other'].includes(gender)) {
      return sendError(res, 400, "Invalid gender value");
    }

    // Validate payment type
    if (!['Online', 'Offline'].includes(paymentType)) {
      return sendError(res, 400, "Invalid payment type");
    }

    // Validate amount (must be a positive number)
    if (typeof amount !== 'number' || amount <= 0) {
      return sendError(res, 400, "Amount must be a positive number");
    }

    // Create a new fee record
    const fee = new DirectMeetFees({ studentID, name, gender, amount, paymentType, course });
    await fee.save();

    res.status(201).json({ success: true, message: 'Direct Meet Fee record created successfully', fee });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ success: false, message: 'Error creating record', error: error.message });
  }
};


// Get All Direct Meet Fee Records with Pagination
export const getAllDirectMeetFees = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const fees = await DirectMeetFees.find()
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalRecords = await DirectMeetFees.countDocuments();

    res.status(200).json({ 
      success: true, 
      fees, 
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching records', error: error.message });
  }
};

// Update Direct Meet Fee Record
export const updateDirectMeetFee = async (req, res) => {
  try {
    const updatedFee = await DirectMeetFees.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedFee) return sendError(res, 404, "Record not found");
    res.status(200).json({ success: true, message: 'Record updated successfully', updatedFee });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ success: false, message: 'Error updating record', error: error.message });
  }
};

// Delete Direct Meet Fee Record
export const deleteDirectMeetFee = async (req, res) => {
  try {
    const deletedFee = await DirectMeetFees.findByIdAndDelete(req.params.id);
    if (!deletedFee) return sendError(res, 404, "Record not found");
    res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting record', error: error.message });
  }
};
