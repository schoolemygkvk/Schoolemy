import mongoose from "mongoose";
import AdvertisementModel from "../../Models/Advertisement/AdvertisementModel.js";
import AdCampaign from "../../Models/Marketing/AdCampaignModel.js";
import { logAudit } from "../../Utils/auditLogger.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../DB/adudios3.js";
import { fileTypeFromBuffer } from "file-type";
// import sharp from "sharp"; // TODO: Install as Lambda Layer
import { sendSuccess, sendError, sendNoContent } from "../../Utils/responseHandler.js";

const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB


async function uploadAdImageToS3(buffer, mimeType, originalName) {
  const AD_BUCKET = process.env.AWS_S3_STAFF_BUCKET || process.env.AWS_BUCKET_NAME;
  const AWS_REGION = process.env.AWS_REGION || "ap-south-1";

  if (!AD_BUCKET)
    throw new Error("AWS_S3_STAFF_BUCKET or AWS_BUCKET_NAME is not configured in .env");

  // Step 1: Validate file size
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error(`File exceeds 5MB limit (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
  }

  // Step 2: Validate MIME type by inspecting actual file content (not extension)
  const fileTypeResult = await fileTypeFromBuffer(buffer);

  if (!fileTypeResult || !ALLOWED_MIMES.includes(fileTypeResult.mime)) {
    throw new Error(`Invalid file type. Only JPEG, PNG, WebP, and GIF allowed. Got: ${fileTypeResult?.mime || 'unknown'}`);
  }

  // Step 3: Generate safe filename using detected extension
  const ext = fileTypeResult.ext;
  const safeFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const key = `advertisements/${safeFileName}`;

  // Step 4: Upload to S3
  const command = new PutObjectCommand({
    Bucket: AD_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: fileTypeResult.mime,
    CacheControl: "public, max-age=31536000"
  });

  await s3.send(command);
  return `https://${AD_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}


export const createAdvertisement = async (req, res) => {
  try {
    const targetUrl = req.body.targetUrl || req.body.target_url;
    const title = req.body.title || "";
    const image_base64 = req.body.image_base64;

    const hasFile = req.file && req.file.buffer;
    if (!hasFile && !image_base64) {
      return res.status(400).json({
        success: false,
        message: "Advertisement image is required. Upload a file (adImage) or send image_base64.",
      });
    }

    let imageUrl = "";

    // Handle file upload
    if (hasFile) {
      try {
        imageUrl = await uploadAdImageToS3(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname
        );
      } catch (uploadErr) {
        return res.status(400).json({
          success: false,
          message: uploadErr.message,
        });
      }
    }
    // Handle base64 upload - convert to buffer and upload to S3
    else if (image_base64) {
      try {
        // Remove data URI prefix if present
        const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        imageUrl = await uploadAdImageToS3(
          buffer,
          'image/jpeg',
          `${title.replace(/\s+/g, '_')}.jpg`
        );
      } catch (uploadError) {
        console.error("Base64 to S3 upload failed:", uploadError);
        return res.status(400).json({
          success: false,
          message: uploadError.message,
        });
      }
    }

    // Deactivate all previous advertisements
    await AdvertisementModel.updateMany({}, { is_active: false });

    let campaignId = null;
    const rawCid = req.body.campaignId;
    if (rawCid && mongoose.Types.ObjectId.isValid(String(rawCid))) {
      const camp = await AdCampaign.findById(rawCid).select("_id").lean();
      if (camp) campaignId = camp._id;
    }

    const advertisement = new AdvertisementModel({
      title,
      target_url: targetUrl || "",
      imageUrl, // Store S3 URL instead of base64
      // Do NOT store image_base64 - reduces database size
      is_active: true,
      createdBy: req.user.id,
      campaignId,
    });

    await advertisement.save();
    await logAudit(
      "Advertisement",
      advertisement._id,
      "Created",
      req.user.id,
      null,
      { title, target_url: targetUrl, imageUrl },
      req
    );

    return sendSuccess(res, 201, "Advertisement created successfully", { advertisement });
  } catch (error) {
    console.error("Create advertisement error:", error);
    return sendError(res, 500, "Failed to create advertisement", error.message);
  }
};


export const createBulkAdvertisements = async (req, res) => {
  try {
    const { images = [], titles = [], targetUrls = [] } = req.body;
    const { advertisements } = req.body;

    // Support both old format (images/titles/targetUrls) and new format (advertisements array)
    let adsToCreate = [];

    if (advertisements && Array.isArray(advertisements)) {
      adsToCreate = advertisements;
    } else if (images && Array.isArray(images) && images.length > 0) {
      // Legacy format support
      adsToCreate = images.map((img, i) => ({
        image_base64: img,
        title: titles[i] || "",
        target_url: targetUrls[i] || "",
        is_active: i === 0,
      }));
    } else {
      return res.status(400).json({
        success: false,
        message: "advertisements array or images array is required",
      });
    }

    if (adsToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one advertisement is required",
      });
    }

    // Deactivate all previous advertisements
    await AdvertisementModel.updateMany({}, { is_active: false });

    // Upload base64 images to S3 and convert to URLs
    const adsWithUrls = await Promise.all(
      adsToCreate.map(async (ad) => {
        const adData = {
          title: ad.title,
          target_url: ad.target_url,
          is_active: ad.is_active !== false,
          createdBy: req.user.id,
        };

        // If base64 provided, upload to S3
        if (ad.image_base64) {
          try {
            const base64Data = ad.image_base64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            adData.imageUrl = await uploadAdImageToS3(
              buffer,
              'image/jpeg',
              `${ad.title.replace(/\s+/g, '_')}.jpg`
            );
          } catch (uploadError) {
            console.error(`Failed to upload image for ad "${ad.title}":`, uploadError);
            throw new Error(`Failed to upload image for ad "${ad.title}": ${uploadError.message}`);
          }
        }

        return adData;
      })
    );

    const result = await AdvertisementModel.insertMany(adsWithUrls);

    res.status(201).json({
      success: true,
      data: result,
      message: `${result.length} advertisements created`,
    });
  } catch (error) {
    console.error("Bulk create advertisements error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create advertisements",
    });
  }
};


export const getActiveAdvertisements = async (req, res) => {
  try {
    const activeAd = await AdvertisementModel.findOne({ is_active: true });

    if (!activeAd) {
      return sendSuccess(res, 200, "No active advertisement found", null);
    }

    // Transform to include image field with fallback support
    const adData = activeAd.toObject();
    adData.image = adData.imageUrl || adData.image_base64 || null; // Fallback: S3 URL > Base64 > null

    sendSuccess(res, 200, "Success", adData);
  } catch (error) {
    console.error("Get active advertisements error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch advertisements",
      error: error.message,
    });
  }
};


export const getAllAdvertisements = async (req, res) => {
  try {
    const { page = 1, limit = 10, is_active } = req.query;

    const query = {};
    if (is_active !== undefined) {
      query.is_active = is_active === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [advertisements, total] = await Promise.all([
      AdvertisementModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AdvertisementModel.countDocuments(query),
    ]);

    // Transform to include image field with fallback support
    const adsWithFallback = advertisements.map(ad => {
      const adData = ad.toObject();
      adData.image = adData.imageUrl || adData.image_base64 || null; // Fallback: S3 URL > Base64 > null
      return adData;
    });

    res.status(200).json({
      success: true,
      data: adsWithFallback,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all advertisements error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch advertisements",
      error: error.message,
    });
  }
};


export const getAdvertisementById = async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement = await AdvertisementModel.findById(id);
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    // Transform to include image field with fallback support
    const adData = advertisement.toObject();
    adData.image = adData.imageUrl || adData.image_base64 || null; // Fallback: S3 URL > Base64 > null

    sendSuccess(res, 200, "Success", adData);
  } catch (error) {
    console.error("Get advertisement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch advertisement",
      error: error.message,
    });
  }
};


export const updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.campaignId === "" || updateData.campaignId === null) {
      updateData.campaignId = null;
    } else if (updateData.campaignId) {
      const cid = String(updateData.campaignId);
      if (!mongoose.Types.ObjectId.isValid(cid)) {
        delete updateData.campaignId;
      } else {
        const camp = await AdCampaign.findById(cid).select("_id").lean();
        updateData.campaignId = camp ? camp._id : null;
      }
    }

    // Store the old data for audit logging
    const oldAdvertisement = await AdvertisementModel.findById(id);
    if (!oldAdvertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    // Handle file upload if provided
    if (req.file && req.file.buffer) {
      try {
        updateData.imageUrl = await uploadAdImageToS3(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname
        );
        // Remove old base64 data when new image is uploaded
        updateData.image_base64 = null;
      } catch (uploadErr) {
        return res.status(400).json({
          success: false,
          message: uploadErr.message,
        });
      }
    }
    // Handle base64 upload if provided
    else if (updateData.image_base64) {
      try {
        const base64Data = updateData.image_base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        updateData.imageUrl = await uploadAdImageToS3(
          buffer,
          'image/jpeg',
          `${updateData.title || oldAdvertisement.title || 'ad'}.jpg`
        );
        // Remove base64 from update data - only store URL
        delete updateData.image_base64;
      } catch (uploadError) {
        console.error("Base64 to S3 upload failed:", uploadError);
        return res.status(400).json({
          success: false,
          message: uploadError.message,
        });
      }
    }

    const advertisement = await AdvertisementModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    await logAudit(
      "Advertisement",
      id,
      "Updated",
      req.user.id,
      {
        title: oldAdvertisement.title,
        target_url: oldAdvertisement.target_url,
      },
      updateData,
      req
    );

    sendSuccess(res, 200, "Advertisement updated", advertisement);
  } catch (error) {
    console.error("Update advertisement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update advertisement",
      error: error.message,
    });
  }
};


export const deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement = await AdvertisementModel.findByIdAndDelete(id);
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    await logAudit(
      "Advertisement",
      id,
      "Deleted",
      req.user.id,
      { title: advertisement.title, target_url: advertisement.target_url },
      null,
      req
    );

    return sendNoContent(res);
  } catch (error) {
    console.error("Delete advertisement error:", error);
    return sendError(res, 500, "Failed to delete advertisement", error.message);
  }
};


export const setAdvertisementActive = async (req, res) => {
  try {
    const { id } = req.params;
    let { is_active } = req.body;
    if (is_active === undefined || is_active === "") {
      is_active = true;
    }

    const advertisement = await AdvertisementModel.findById(id);
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    // If setting to active, deactivate all others
    if (is_active) {
      await AdvertisementModel.updateMany(
        { _id: { $ne: id } },
        { is_active: false }
      );
    }

    const updated = await AdvertisementModel.findByIdAndUpdate(
      id,
      { is_active },
      { new: true }
    );

    await logAudit(
      "Advertisement",
      id,
      is_active ? "Activated" : "Deactivated",
      req.user.id,
      { is_active: advertisement.is_active },
      { is_active },
      req
    );

    sendSuccess(res, 200, "Advertisement status updated", updated);
  } catch (error) {
    console.error("Set advertisement active error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update advertisement status",
      error: error.message,
    });
  }
};


export const trackAdvertisementEvent = async (req, res) => {
  try {
    const { advertisementId, event } = req.body || {};
    if (!advertisementId || !mongoose.Types.ObjectId.isValid(String(advertisementId))) {
      return res.status(400).json({
        success: false,
        message: "Valid advertisementId is required",
      });
    }
    const ev = String(event || "").toLowerCase();
    if (ev !== "impression" && ev !== "click") {
      return res.status(400).json({
        success: false,
        message: 'event must be "impression" or "click"',
      });
    }

    const field = ev === "impression" ? "impressionCount" : "clickCount";
    const updated = await AdvertisementModel.findByIdAndUpdate(
      advertisementId,
      { $inc: { [field]: 1 } },
      { new: true, select: "impressionCount clickCount" }
    );

    if (!updated) {
      return sendError(res, 404, "Advertisement not found");
    }

    res.status(200).json({
      success: true,
      data: {
        impressionCount: updated.impressionCount,
        clickCount: updated.clickCount,
      },
    });
  } catch (error) {
    console.error("trackAdvertisementEvent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record event",
      error: error.message,
    });
  }
};


export const getAdvertisementAnalyticsSummary = async (req, res) => {
  try {
    const campaignColl = AdCampaign.collection.name;

    const [totals, topAds, byCampaign] = await Promise.all([
      AdvertisementModel.aggregate([
        {
          $group: {
            _id: null,
            totalAds: { $sum: 1 },
            totalImpressions: { $sum: { $ifNull: ["$impressionCount", 0] } },
            totalClicks: { $sum: { $ifNull: ["$clickCount", 0] } },
            activeAds: {
              $sum: { $cond: [{ $eq: ["$is_active", true] }, 1, 0] },
            },
          },
        },
      ]),
      AdvertisementModel.find()
        .sort({ impressionCount: -1, clickCount: -1 })
        .limit(15)
        .select("title target_url is_active impressionCount clickCount campaignId createdAt")
        .lean(),
      AdvertisementModel.aggregate([
        {
          $group: {
            _id: "$campaignId",
            ads: { $sum: 1 },
            impressions: { $sum: { $ifNull: ["$impressionCount", 0] } },
            clicks: { $sum: { $ifNull: ["$clickCount", 0] } },
          },
        },
        {
          $lookup: {
            from: campaignColl,
            localField: "_id",
            foreignField: "_id",
            as: "camp",
          },
        },
        {
          $project: {
            campaignId: "$_id",
            campaignName: { $arrayElemAt: ["$camp.name", 0] },
            ads: 1,
            impressions: 1,
            clicks: 1,
          },
        },
        { $sort: { impressions: -1 } },
      ]),
    ]);

    const t = totals[0] || {
      totalAds: 0,
      totalImpressions: 0,
      totalClicks: 0,
      activeAds: 0,
    };

    const ctr =
      t.totalImpressions > 0
        ? ((t.totalClicks / t.totalImpressions) * 100).toFixed(2)
        : "0.00";

    res.status(200).json({
      success: true,
      data: {
        totals: {
          totalAds: t.totalAds,
          totalImpressions: t.totalImpressions,
          totalClicks: t.totalClicks,
          activeAds: t.activeAds,
          ctrPercent: Number(ctr),
        },
        topAds,
        byCampaign,
      },
    });
  } catch (error) {
    console.error("getAdvertisementAnalyticsSummary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load analytics",
      error: error.message,
    });
  }
};
