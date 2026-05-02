import { Router } from 'express';
import { verifyToken } from '../../Middleware/authMiddleware.js';
import { checkRole } from '../../Middleware/checkRole.js';
const router = Router();
import {
  createVotingPoll,
  getAllVotingPolls,
  getVotingPollById,
  castVote,
  getVotingResults,
  updateVotingPoll,
  deleteVotingPoll,
  getActivePolls,
  getPollStatistics,
  getLiveResults
} from '../../Controllers/BOS/bos-votingController.js';

// Poll CRUD operations
router.post('/create-poll', verifyToken, checkRole(['boscontroller', 'admin']), createVotingPoll);
router.get('/polls', verifyToken, checkRole(['boscontroller', 'admin']), getAllVotingPolls);
router.get('/poll/:id', verifyToken, checkRole(['boscontroller', 'admin']), getVotingPollById);
router.put('/poll/:poll_id', verifyToken, checkRole(['boscontroller', 'admin']), updateVotingPoll);
router.delete('/poll/:poll_id', verifyToken, checkRole(['boscontroller', 'admin']), deleteVotingPoll);

// Voting operations
router.post('/poll/:poll_id/vote', verifyToken, checkRole(['boscontroller', 'admin', 'bosmembers']), castVote);
router.get('/poll/:poll_id/results', verifyToken, checkRole(['boscontroller', 'admin']), getVotingResults);
router.get('/poll/:poll_id/live-results', verifyToken, checkRole(['boscontroller', 'admin']), getLiveResults);

// User-specific operations
router.get('/active-polls', verifyToken, checkRole(['boscontroller', 'admin']), getActivePolls);

// Statistics (for boscontroller only)
router.get('/statistics', verifyToken, checkRole(['boscontroller', 'admin']), getPollStatistics);

export default router;
