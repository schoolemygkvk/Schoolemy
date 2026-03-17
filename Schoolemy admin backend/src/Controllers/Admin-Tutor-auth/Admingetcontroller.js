import Admin from "../../Models/Admin/Admin-login-Model.js";

export const getAllData = async (req, res) => {
  try {
    const data = await Admin.find()
      .select(
        "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -forgotPasswordOtpVerified -loginHistory -profilePictureUpload -govtIdProofs.documentImage"
      )
      .lean();
    res.status(200).json(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
};

/** Get one admin by ID – full data excluding loginHistory and sensitive fields (for "View full data"). */
export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id)
      .select(
        "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -forgotPasswordOtpVerified -loginHistory"
      )
      .lean();
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json(admin);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching admin", error: error.message });
  }
};
