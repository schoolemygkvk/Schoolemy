import { Router } from 'express';
import { verifyToken } from '../../Middleware/authMiddleware.js';
import { checkRole } from '../../Middleware/checkRole.js';
import { bosProposalPdfUpload } from '../../Middleware/bosProposalUpload.js';
const router = Router();
import { createProposal, getAllProposals, getProposalById, updateProposal, updateStatus } from '../../Controllers/BOS/bos-Courseproposal.js';
import { generateProposalPresignedUrl, generateProposalDownloadUrl, deleteProposalFile } from '../../Controllers/BOS/bos-S3ProposalController.js';

const handleMulterPdf = (req, res, next) => {
  bosProposalPdfUpload.single('pdf_file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'PDF exceeds 20MB limit' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    next();
  });
};

// CRUD operations (multipart supports up to 20MB PDF; text fields in req.body)
router.post(
  '/createproposal',
  verifyToken,
  checkRole(['boscontroller', 'admin']),
  handleMulterPdf,
  createProposal
);
router.get('/getproposal', verifyToken, checkRole(['boscontroller', 'admin']), getAllProposals);
router.get('/getproposal/:id', verifyToken, checkRole(['boscontroller', 'admin']), getProposalById);
router.put('/updateproposal/:id', verifyToken, checkRole(['boscontroller', 'admin']), updateProposal);

// Status update
router.patch('/updateproposal/:id/status', verifyToken, checkRole(['boscontroller', 'admin']), updateStatus);

// S3 presigned URLs for direct upload/download
router.post('/presigned-proposal-url', verifyToken, checkRole(['boscontroller', 'admin']), generateProposalPresignedUrl);
router.post('/presigned-proposal-download', verifyToken, checkRole(['boscontroller', 'admin']), generateProposalDownloadUrl);
router.delete('/proposal-file', verifyToken, checkRole(['boscontroller', 'admin']), deleteProposalFile);

export default router;
