import { Router } from 'express';
import { createDecision, getAllDecisions, updateDecisionStatus } from '../../Controllers/BOS/recentDecisionController.js';

const router = Router();

// POST route to create a new decision
router.post('/decision-post', createDecision);
// GET route to get all decisions
router.get('/decision-get', getAllDecisions);
// PATCH route to approve/reject decision (COT)
router.patch('/decision/:id/status', updateDecisionStatus);

export default router;
