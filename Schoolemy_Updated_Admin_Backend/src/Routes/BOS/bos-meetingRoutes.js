import { Router } from 'express';
import { verifyToken } from '../../Middleware/authMiddleware.js';
import { checkRole } from '../../Middleware/checkRole.js';
import { createMeeting, getMeetingById, getAllMeetings, updateMeeting, deleteMeeting } from '../../Controllers/BOS/bos-meetingController.js';

const router = Router();

// Create a new meeting
router.post('/create-meetings', verifyToken, checkRole(['boscontroller', 'admin']), createMeeting);

// Get all meetings with pagination and filtering
router.get('/', verifyToken, checkRole(['boscontroller', 'admin']), getAllMeetings);

// Get a specific meeting by ID
router.get('/meetings/:id', verifyToken, checkRole(['boscontroller', 'admin']), getMeetingById);

// Update a meeting
router.put('/:meeting_id', verifyToken, checkRole(['boscontroller', 'admin']), updateMeeting);

// Delete a meeting
router.delete('/:meeting_id', verifyToken, checkRole(['boscontroller', 'admin']), deleteMeeting);

export default router;
