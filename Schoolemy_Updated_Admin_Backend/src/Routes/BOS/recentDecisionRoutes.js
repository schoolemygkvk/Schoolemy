import { Router } from 'express';
import { createDecision, getAllDecisions, updateDecisionStatus } from '../../Controllers/BOS/recentDecisionController.js';
import { verifyToken } from '../../Middleware/authMiddleware.js';
import { checkRole } from '../../Middleware/checkRole.js';

const router = Router();

const decisionReaders = [
  'boscontroller',
  'bosmembers',
  'admin',
  'committeeoftrustees',
];

// POST route to create a new decision (BOS / admin)
router.post(
  '/decision-post',
  verifyToken,
  checkRole(['boscontroller', 'bosmembers', 'admin', 'committeeoftrustees']),
  createDecision
);
// GET route to get all decisions
router.get('/decision-get', verifyToken, checkRole(decisionReaders), getAllDecisions);
// PATCH route to approve/reject decision (COT / admin)
router.patch(
  '/decision/:id/status',
  verifyToken,
  checkRole(['committeeoftrustees', 'admin']),
  updateDecisionStatus
);

export default router;
