import DirectMeetStudyMaterial from "../../Models/Data-Maintenance/direct-meet-study-material-model.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

//direct meet study-material

// AWS S3 Config
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});


export const addStudyMaterial = async (req, res) => {
  try {
    // Extract form data and user info
    const { title, description } = req.body;
    const uploadedBy = req.user.id; // Use authenticated user ID

    const file = req.file;
    if (!file) {
      return sendError(res, 400, "No file uploaded");
    }

    // Configure S3 upload
    const uniqueKey = `study-materials/${Date.now()}-${file.originalname}`;
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
      Key: uniqueKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadCommand = new PutObjectCommand(s3Params);
    const s3Data = await s3.send(uploadCommand);
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_SCHOOLEMY}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;
    
    // Create database record
    const studyMaterial = new DirectMeetStudyMaterial({
      title,
      description,
      fileUrl: fileUrl,
      fileType: file.mimetype,
      uploadedBy
    });

    await studyMaterial.save();

    res.status(201).json({
      success: true,
      message: "Study material uploaded successfully",
      studyMaterial: {
        id: studyMaterial._id,
        title: studyMaterial.title,
        url: studyMaterial.fileUrl
      }
    });

  } catch (error) {
    console.error("Upload Failed:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};


export const getAllStudyMaterials = async (req, res) => {
    try {
        const studyMaterials = await DirectMeetStudyMaterial.find();
        res.status(200).json({ success: true, studyMaterials });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching study materials", error: error.message });
    }
};

export const getStudyMaterialById = async (req, res) => {
    try {
        const studyMaterial = await DirectMeetStudyMaterial.findById(req.params.id);
        if (!studyMaterial) {
            return sendError(res, 404, "Study material not found");
        }
        res.status(200).json({ success: true, studyMaterial });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching study material", error: error.message });
    }
};

export const updateStudyMaterial = async (req, res) => {
    try {
        const { title, description, fileUrl } = req.body;
        const studyMaterial = await DirectMeetStudyMaterial.findByIdAndUpdate(
            req.params.id,
            { title, description, fileUrl },
            { new: true }
        );
        if (!studyMaterial) {
            return sendError(res, 404, "Study material not found");
        }
        res.status(200).json({ success: true, message: "Study material updated successfully", studyMaterial });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating study material", error: error.message });
    }
};

export const deleteStudyMaterial = async (req, res) => {
    try {
        const studyMaterial = await DirectMeetStudyMaterial.findByIdAndDelete(req.params.id);
        if (!studyMaterial) {
            return sendError(res, 404, "Study material not found");
        }
        res.status(200).json({ success: true, message: "Study material deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting study material", error: error.message });
    }
};