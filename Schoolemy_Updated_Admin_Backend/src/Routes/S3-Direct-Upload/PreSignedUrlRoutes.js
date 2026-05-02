import express from "express";
import {
  generatePreSignedUploadUrl,
  getUploadLimits,
} from "../../Controllers/S3-Direct-Upload/PreSignedUrlController.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";

const router = express.Router();


router.post("/generate-upload-url", verifyToken, generatePreSignedUploadUrl);


router.get("/upload-limits", getUploadLimits);

export default router;
