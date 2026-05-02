import express from "express";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import { checkRole } from "../../Middleware/checkRole.js";
import {
  createCampaign,
  listCampaigns,
  getCampaignById,
  updateCampaign,
  updateCampaignStatus,
  deleteCampaign,
} from "../../Controllers/Marketing/CampaignController.js";

const router = express.Router();

const marketingRoles = ["admin", "marketing", "superadmin"];

router.post("/campaigns", verifyToken, checkRole(marketingRoles), createCampaign);
router.get("/campaigns", verifyToken, checkRole(marketingRoles), listCampaigns);
router.get("/campaigns/:id", verifyToken, checkRole(marketingRoles), getCampaignById);
router.put("/campaigns/:id", verifyToken, checkRole(marketingRoles), updateCampaign);
router.patch(
  "/campaigns/:id/status",
  verifyToken,
  checkRole(marketingRoles),
  updateCampaignStatus
);
router.delete("/campaigns/:id", verifyToken, checkRole(marketingRoles), deleteCampaign);

export default router;
