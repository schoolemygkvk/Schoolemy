import mongoose from "mongoose";
import AdCampaign from "../../Models/Marketing/AdCampaignModel.js";
import AdvertisementModel from "../../Models/Advertisement/AdvertisementModel.js";
import { logAudit } from "../../Utils/auditLogger.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

async function postIntegrationWebhook(url, payload) {
  if (!url || typeof url !== "string" || !url.startsWith("https://")) return;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (e) {
    console.warn("Campaign integration webhook failed:", e?.message || e);
  } finally {
    clearTimeout(t);
  }
}

export const createCampaign = async (req, res) => {
  try {
    const {
      name,
      description,
      status = "draft",
      startDate,
      endDate,
      integrationWebhookUrl,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Campaign name is required",
      });
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be on or after start date",
      });
    }

    const campaign = await AdCampaign.create({
      name: name.trim(),
      description: (description || "").trim(),
      status,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user?.id,
      integrationWebhookUrl: (integrationWebhookUrl || "").trim(),
    });

    await logAudit(
      "Advertisement",
      campaign._id,
      "Created",
      req.user.id,
      null,
      { name: campaign.name, status: campaign.status, kind: "campaign" },
      req
    );

    sendSuccess(res, 201, "Created successfully", campaign );
  } catch (error) {
    console.error("createCampaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create campaign",
      error: error.message,
    });
  }
};

export const listCampaigns = async (req, res) => {
  try {
    const coll = AdvertisementModel.collection.name;

    const campaigns = await AdCampaign.aggregate([
      { $sort: { updatedAt: -1 } },
      {
        $lookup: {
          from: coll,
          let: { cid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$campaignId", "$$cid"] },
              },
            },
            {
              $group: {
                _id: null,
                adCount: { $sum: 1 },
                impressions: { $sum: { $ifNull: ["$impressionCount", 0] } },
                clicks: { $sum: { $ifNull: ["$clickCount", 0] } },
              },
            },
          ],
          as: "agg",
        },
      },
      {
        $addFields: {
          adCount: {
            $ifNull: [{ $arrayElemAt: ["$agg.adCount", 0] }, 0],
          },
          totalImpressions: {
            $ifNull: [{ $arrayElemAt: ["$agg.impressions", 0] }, 0],
          },
          totalClicks: {
            $ifNull: [{ $arrayElemAt: ["$agg.clicks", 0] }, 0],
          },
        },
      },
      { $project: { agg: 0 } },
    ]);

    sendSuccess(res, 200, "Success", campaigns );
  } catch (error) {
    console.error("listCampaigns:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list campaigns",
      error: error.message,
    });
  }
};

export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid id");
    }

    const campaign = await AdCampaign.findById(id).lean();
    if (!campaign) {
      return sendError(res, 404, "Campaign not found");
    }

    const ads = await AdvertisementModel.find({ campaignId: id })
      .select("title target_url is_active impressionCount clickCount createdAt imageUrl")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: { ...campaign, advertisements: ads } });
  } catch (error) {
    console.error("getCampaignById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get campaign",
      error: error.message,
    });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid id");
    }

    const prev = await AdCampaign.findById(id);
    if (!prev) {
      return sendError(res, 404, "Campaign not found");
    }

    const {
      name,
      description,
      startDate,
      endDate,
      integrationWebhookUrl,
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (description !== undefined) updates.description = String(description).trim();
    if (startDate !== undefined)
      updates.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (integrationWebhookUrl !== undefined)
      updates.integrationWebhookUrl = String(integrationWebhookUrl).trim();

    if (updates.startDate && updates.endDate && updates.endDate < updates.startDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be on or after start date",
      });
    }

    const campaign = await AdCampaign.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    await logAudit(
      "Advertisement",
      id,
      "Updated",
      req.user.id,
      { name: prev.name },
      { ...updates, kind: "campaign" },
      req
    );

    sendSuccess(res, 200, "Success", campaign );
  } catch (error) {
    console.error("updateCampaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update campaign",
      error: error.message,
    });
  }
};

export const updateCampaignStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid id");
    }

    const allowed = ["draft", "scheduled", "active", "paused", "completed"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${allowed.join(", ")}`,
      });
    }

    const prev = await AdCampaign.findById(id);
    if (!prev) {
      return sendError(res, 404, "Campaign not found");
    }

    const campaign = await AdCampaign.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    await logAudit(
      "Advertisement",
      id,
      "Updated",
      req.user.id,
      { status: prev.status },
      { status, kind: "campaign_status" },
      req
    );

    const webhookUrl = campaign.integrationWebhookUrl || prev.integrationWebhookUrl;
    if (webhookUrl) {
      postIntegrationWebhook(webhookUrl, {
        event: "campaign.status_changed",
        campaignId: String(campaign._id),
        name: campaign.name,
        previousStatus: prev.status,
        status: campaign.status,
        at: new Date().toISOString(),
      });
    }

    sendSuccess(res, 200, "Success", campaign );
  } catch (error) {
    console.error("updateCampaignStatus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update campaign status",
      error: error.message,
    });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid id");
    }

    const campaign = await AdCampaign.findByIdAndDelete(id);
    if (!campaign) {
      return sendError(res, 404, "Campaign not found");
    }

    await AdvertisementModel.updateMany(
      { campaignId: id },
      { $set: { campaignId: null } }
    );

    await logAudit(
      "Advertisement",
      id,
      "Deleted",
      req.user.id,
      { name: campaign.name, kind: "campaign" },
      null,
      req
    );

    res.status(200).json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    console.error("deleteCampaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete campaign",
      error: error.message,
    });
  }
};
