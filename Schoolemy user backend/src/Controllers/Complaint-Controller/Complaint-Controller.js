//Controllers/Complaint-Controller/Complaint-Controller.js
import Complaint from "../../Models/Complaint-Model/Complaint-Model.js";

// Submit a new complaint
export const submitComplaint = async (req, res) => {
  try {
    const { subject, description, category } = req.body;
    const userId = req.userId; // From auth middleware

    // Validation
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

    // Get user details (assuming you have a User model)
    const User = (await import("../../Models/User-Model/User-Model.js"))
      .default;
    const user = await User.findById(userId).select(
      "username email studentRegisterNumber",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create new complaint
    const newComplaint = new Complaint({
      userId,
      userName: user.username || user.email.split("@")[0],
      userEmail: user.email,
      regNo: user.studentRegisterNumber || null,
      subject: subject.trim(),
      description: description.trim(),
      category: category || "Other",
    });

    await newComplaint.save();

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint: {
        id: newComplaint._id,
        subject: newComplaint.subject,
        regNo: newComplaint.regNo,
        status: newComplaint.status,
        createdAt: newComplaint.createdAt,
      },
    });
  } catch (error) {
    console.error("Submit complaint error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get user's complaints
export const getUserComplaints = async (req, res) => {
  try {
    const userId = req.userId;

    const complaints = await Complaint.find({ userId })
      .sort({ createdAt: -1 })
      .select(
        "subject description category regNo status adminResponse createdAt resolvedAt",
      );

    res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error("Get user complaints error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
