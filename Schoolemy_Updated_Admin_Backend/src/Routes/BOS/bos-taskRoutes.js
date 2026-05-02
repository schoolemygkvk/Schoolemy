import { Router } from 'express';
import { verifyToken } from '../../Middleware/authMiddleware.js';
import { checkRole } from '../../Middleware/checkRole.js';
const router = Router();
import {
  createTask,
  getAllTasks,
  getTaskById,
  getTasksByMeetingId,
  getTasksByAssignedTo,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getOverdueTasks
} from '../../Controllers/BOS/bos-taskController.js';

// CRUD operations
router.post('/createtask', verifyToken, checkRole(['boscontroller', 'admin']), createTask);
router.get('/gettasks', verifyToken, checkRole(['boscontroller', 'admin']), getAllTasks);
router.get('/gettask/:id', verifyToken, checkRole(['boscontroller', 'admin']), getTaskById);
router.put('/updatetask/:id', verifyToken, checkRole(['boscontroller', 'admin']), updateTask);
router.delete('/deletetask/:id', verifyToken, checkRole(['boscontroller', 'admin']), deleteTask);

// Specific queries
router.get('/getmeeting/:meeting_id/tasks', verifyToken, checkRole(['boscontroller', 'admin']), getTasksByMeetingId);
router.get('/getassigned/:assigned_to/tasks', verifyToken, checkRole(['boscontroller', 'admin']), getTasksByAssignedTo);
router.get('/getoverdue', verifyToken, checkRole(['boscontroller', 'admin']), getOverdueTasks);

// Status update
router.patch('/updatetask/:id/status', verifyToken, checkRole(['boscontroller', 'admin']), updateTaskStatus);

export default router;
