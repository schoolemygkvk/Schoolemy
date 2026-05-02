import AuditLog from "../../Models/Auditing/AuditLogModel.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, entityType, action, performedBy, startDate, endDate } = req.query;

    const query = {};
    if (entityType) query.entityType = entityType;
    if (action) query.action = action;
    if (performedBy) query.performedBy = performedBy;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('performedBy', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query)
    ]);

    sendPaginated(res, data, total, page, limit, "Items retrieved");
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch audit logs", error: error.message });
  }
};

export const getEntityHistory = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const logs = await AuditLog.find({ entityType, entityId })
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 });

    if (logs.length === 0) {
      return sendError(res, 404, "No audit history found for this entity");
    }

    sendSuccess(res, 200, "Success", logs );
  } catch (error) {
    console.error("Get entity history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch entity history", error: error.message });
  }
};

export const getAdminActivity = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find({ performedBy: adminId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments({ performedBy: adminId })
    ]);

    sendPaginated(res, data, total, page, limit, "Items retrieved");
  } catch (error) {
    console.error("Get admin activity error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin activity", error: error.message });
  }
};
