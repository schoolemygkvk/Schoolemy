import express from 'express';
import { verifyToken } from '../../Middleware/authMiddleware.js';
import { checkRole } from '../../Middleware/checkRole.js';
import { getAuditLogs, getEntityHistory, getAdminActivity } from '../../Controllers/Auditing/AuditLogController.js';

const router = express.Router();

// All audit routes require admin or auditor role
router.get('/', verifyToken, checkRole(['admin', 'auditor']), getAuditLogs);
router.get('/entity/:entityType/:entityId', verifyToken, checkRole(['admin', 'auditor']), getEntityHistory);
router.get('/admin/:adminId', verifyToken, checkRole(['admin', 'auditor']), getAdminActivity);

export default router;
