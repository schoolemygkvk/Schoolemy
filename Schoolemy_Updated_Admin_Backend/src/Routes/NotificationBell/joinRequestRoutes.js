// File: admin-backend/src/Routes/NotificationBell/joinRequestRoutes.js

import express from 'express';
const router = express.Router();

import { getAllJoinRequests, markAttendance, getUniqueCourseNames } from  '../../Controllers/Notificationbell/JoinRequestController.js';
import { verifyToken } from '../../Middleware/authMiddleware.js';

router.get('/courses', verifyToken, getUniqueCourseNames);
router.get('/', verifyToken, getAllJoinRequests);
router.put('/:requestId/attendance', verifyToken, markAttendance);
export default router;