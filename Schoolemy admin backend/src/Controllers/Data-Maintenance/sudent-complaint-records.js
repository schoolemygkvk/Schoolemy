import StudentComplaint from "../../Models/Data-Maintenance/student-compliant-records-model.js";

// Create new complaint
export const createComplaint = async (req, res) => {
  try {
    const {
      userId,
      userName,
      regNo,
      userEmail,
      subject,
      description,
      category,
    } = req.body;

    if (
      !userId ||
      !userName ||
      !regNo ||
      !userEmail ||
      !subject ||
      !description ||
      !category
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const complaint = await StudentComplaint.create({
      userId,
      userName,
      regNo,
      userEmail,
      subject,
      description,
      category,
      status: "pending",
    });
    res.status(201).json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all complaints
export const getAllComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const [totalCount, complaints] = await Promise.all([
      StudentComplaint.countDocuments(filter),
      StudentComplaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      complaints,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update complaint status
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    if (!["pending", "resolved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const updateData = {
      status,
      adminResponse: adminResponse || null,
      resolvedAt: status !== "pending" ? new Date() : null,
    };

    const complaint = await StudentComplaint.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Status updated", complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete complaint
export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await StudentComplaint.findByIdAndDelete(id);
    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Complaint deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
