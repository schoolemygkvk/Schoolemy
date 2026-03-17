import StaffDetails from "../../Models/Resources-Model/staff-details-model.js";

// Get all staff with pagination
export const getAllStaff = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const staff = await StaffDetails.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await StaffDetails.countDocuments();

    res.status(200).json({
      success: true,
      staff,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


