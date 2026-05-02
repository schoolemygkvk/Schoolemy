import Admin from "../../Models/Admin/Admin-login-Model.js";
import { sendSuccess, sendError, sendPaginated } from "../../Utils/responseHandler.js";

export const getAllData = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [admins, total] = await Promise.all([
      Admin.find(query)
        .select(
          "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -forgotPasswordOtpVerified -loginHistory -govtIdProofs.documentImage"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Admin.countDocuments(query)
    ]);

    sendPaginated(res, admins, total, page, limit, "Admins retrieved successfully");
  } catch (error) {
    console.error("Get all admins error:", error);
    sendError(res, 500, "Error fetching admins", { details: error.message });
  }
};


export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id)
      .select(
        "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -forgotPasswordOtpVerified -loginHistory"
      )
      .lean();
    if (!admin) {
      return sendError(res, 404, "Admin not found");
    }
    sendSuccess(res, 200, "Admin retrieved successfully", admin);
  } catch (error) {
    sendError(res, 500, "Error fetching admin", { details: error.message });
  }
};
