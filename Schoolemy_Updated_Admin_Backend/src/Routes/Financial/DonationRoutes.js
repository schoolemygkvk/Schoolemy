import express from "express";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import { checkRole } from "../../Middleware/checkRole.js";
import {
  createDonation,
  getAllDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  verifyDonation,
  getDonationStatistics,
} from "../../Controllers/Financial/DonationController.js";

const router = express.Router();

// Donation routes
router.post("/donation/create", verifyToken, checkRole(['admin', 'finance']), createDonation);
router.get("/donation/list", verifyToken, checkRole(['admin', 'finance']), getAllDonations);
router.get("/donation/statistics", verifyToken, checkRole(['admin', 'finance']), getDonationStatistics);
router.get("/donation/:donationId", verifyToken, checkRole(['admin', 'finance']), getDonationById);
router.put("/donation/:donationId", verifyToken, checkRole(['admin', 'finance']), updateDonation);
router.delete("/donation/:donationId", verifyToken, checkRole(['admin', 'finance']), deleteDonation);
router.patch("/donation/:donationId/verify", verifyToken, checkRole(['admin', 'finance']), verifyDonation);

export default router;
