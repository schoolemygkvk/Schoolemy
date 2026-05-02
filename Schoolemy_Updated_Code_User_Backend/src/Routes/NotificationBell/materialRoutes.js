// File: user-backend/src/Routes/NotificationBell/materialRoutes.js

import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import { getMyMaterials } from "../../Controllers/NotificationBell/MaterialController.js";

const router = express.Router();

router.get("/", asyncHandler(getMyMaterials));

export default router;