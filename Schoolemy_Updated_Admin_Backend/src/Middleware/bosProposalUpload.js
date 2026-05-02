import multer from "multer";
import fs from "fs";
import path from "path";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

const isLambda = process.env.NODE_ENV === "lambda" || !!process.env.AWS_EXECUTION_ENV;
const uploadDir = isLambda
  ? path.join("/tmp", "bos-proposals")
  : path.join(process.cwd(), "uploads", "bos-proposals");

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.pdf`;
    cb(null, safe);
  },
});

export const bosProposalPdfUpload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});
