import  logger  from "../../Utils/logger.js";

import StaffDetails from "../../Models/Resources-Model/staff-details-model.js";
import { buildSafeStaffResponse, validateNoPII } from "../../Middleware/piiProtectionMiddleware.js";


export const getAllStaff = async (req, res) => {
  try {

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to access staff information",
      });
    }


    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;


    const staff = await StaffDetails.find()
      .select("-aadharNumber -age -address -date")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await StaffDetails.countDocuments();


    const safeStaff = staff.map(doc => buildSafeStaffResponse(doc));


    const responseData = {
      success: true,
      staff: safeStaff,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    };


    try {
      validateNoPII(responseData);
    } catch (validationError) {
      logger.error("[SECURITY] PII validation failed:", validationError.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error: PII validation failed",
      });
    }

    res.status(200).json(responseData);
  } catch (error) {
    logger.error("[getAllStaff Error]", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


