import User from "../../Models/User/User-Model.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentRegisterNumber: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [
      users,
      total,
      maleCount,
      femaleCount,
      activeCount,
      inactiveCount,
    ] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
      User.countDocuments({ ...query, gender: { $regex: /^male$/i } }),
      User.countDocuments({ ...query, gender: { $regex: /^female$/i } }),
      User.countDocuments({ ...query, status: 'active' }),
      User.countDocuments({ ...query, status: 'inactive' }),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        maleCount,
        femaleCount,
        activeCount,
        inactiveCount,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users", error: error.message });
  }
};

// Update a user by ID
export const updateUserById = async (req, res) => {
  try {
    // Field allowlist to prevent role escalation and unauthorized changes
    const allowedFields = ['name', 'email', 'mobile', 'status', 'profile'];
    const updateData = {};
    allowedFields.forEach(field => {
      if (field in req.body) updateData[field] = req.body[field];
    });

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return sendError(res, 404, "User not found");
    }

    res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user", error: error.message });
  }
};

// Delete a user by ID
export const deleteUserById = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return sendError(res, 404, "User not found");
    }

    res.status(200).json({ success: true, message: "User deleted successfully", data: deletedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
  }
};
