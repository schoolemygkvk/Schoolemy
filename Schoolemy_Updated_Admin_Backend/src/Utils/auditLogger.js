import AuditLog from "../Models/Auditing/AuditLogModel.js";

export const logAudit = async (entityType, entityId, action, performedBy, before = null, after = null, req = null) => {
  try {
    const auditLog = new AuditLog({
      entityType,
      entityId,
      action,
      performedBy,
      before,
      after,
      ipAddress: req ? req.ip : undefined,
      userAgent: req ? req.get('user-agent') : undefined,
      timestamp: new Date()
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't throw - logging failure shouldn't break the main operation
  }
};

export const logUserAction = async (userId, action, performedBy, before, after, req) => {
  return logAudit('User', userId, action, performedBy, before, after, req);
};

export const logCourseAction = async (courseId, action, performedBy, before, after, req) => {
  return logAudit('Course', courseId, action, performedBy, before, after, req);
};

export const logPaymentAction = async (paymentId, action, performedBy, before, after, req) => {
  return logAudit('Payment', paymentId, action, performedBy, before, after, req);
};
