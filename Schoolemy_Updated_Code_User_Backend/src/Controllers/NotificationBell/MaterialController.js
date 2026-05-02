// File: user-backend/src/Controllers/NotificationBell/MaterialController.js

import  logger  from "../../Utils/logger.js";

import SentMaterial from "../../Models/NotificationBell/SentMaterialModel.js";

export async function getMyMaterials(req, res) {
  try {
    const materials = await SentMaterial.find({ userId: req.userId }).sort({ sentAt: -1 });
    res.status(200).json(materials);
  } catch (error) {
    logger.error("Error fetching user materials:", error);
    res.status(500).json({ message: "Failed to fetch your materials." });
  }
}