

import express from "express";
import {
  startMultipartUpload,
  getPresignedUrlForPart,
  completeMultipartUpload,
  abortMultipartUpload,
} from "../../Controllers/S3-Direct-Upload/S3MultipartController.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";

const router = express.Router();


router.post("/multipart/start", verifyToken, startMultipartUpload);


router.post("/multipart/presign", verifyToken, getPresignedUrlForPart);


router.post("/multipart/complete", verifyToken, completeMultipartUpload);


router.post("/multipart/abort", verifyToken, abortMultipartUpload);

export default router;
