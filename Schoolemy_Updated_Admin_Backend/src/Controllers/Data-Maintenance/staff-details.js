
import StaffDetails from "../../Models/Data-Maintenance/staff-details-model.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../DB/adudios3.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Upload file to S3
const uploadToS3 = async (file) => {
  try {
    const bucketName = process.env.AWS_S3_STAFF_BUCKET || process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION || "ap-south-1";
    
    if (!bucketName) {
      throw new Error('AWS bucket name is not configured. Please set AWS_S3_STAFF_BUCKET or AWS_BUCKET_NAME environment variable.');
    }
    
    if (!file || !file.buffer) {
      throw new Error('File buffer is missing. Ensure file is uploaded correctly.');
    }
    
    const key = `staff-profiles/${Date.now()}-${file.originalname}`;
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/octet-stream',
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    
    // Construct the S3 URL with proper encoding
    const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/');
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${encodedKey}`;
    
    return {
      Location: s3Url,
      Key: key
    };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

// Delete file from S3
const deleteFromS3 = async (key) => {
  const bucketName = process.env.AWS_S3_STAFF_BUCKET || process.env.AWS_BUCKET_NAME;
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const command = new DeleteObjectCommand(params);
  return s3.send(command);
};


// Create new staff with profile picture
export const createStaff = async (req, res) => {
  try {
    const { name, gender, age, address, aadharNumber, designation } = req.body;

    const requiredFields = { name, gender, age, address, aadharNumber, designation };
    const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);
    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
    }

    const existingStaff = await StaffDetails.findOne({ aadharNumber });
    if (existingStaff) {
      return sendError(res, 400, "Staff with this Aadhar number already exists");
    }
    

    const addressObj =
      typeof address === "string" ? JSON.parse(address) : address;

    const staffData = {
      name,
      gender,
      age,
      address: addressObj,
      aadharNumber,
      designation,
    };

    // Handle file upload if present
    if (req.file) {
      try {
        // Validate file buffer exists
        if (!req.file.buffer) {
          throw new Error('File buffer is missing');
        }
        
        const result = await uploadToS3(req.file);
        if (result && result.Key && result.Location) {
          staffData.profilePicture = {
            public_id: result.Key,
            url: result.Location,
          };
        } else {
          throw new Error('S3 upload returned invalid response');
        }
      } catch (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        // Continue without profile picture if upload fails
        // You can also return an error here if profile picture is required
        staffData.profilePicture = {
          public_id: null,
          url: null,
        };
      }
    } else {
      // Set default null values if no file is provided
      staffData.profilePicture = {
        public_id: null,
        url: null,
      };
    }

    const staff = await StaffDetails.create(staffData);
    res.status(201).json({success: true,staff});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all staff with pagination
export const getAllStaff = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const staff = await StaffDetails.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await StaffDetails.countDocuments();

    res.status(200).json({
      success: true,
      staff,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update staff with profile picture
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, age, address, aadharNumber, designation } = req.body;

    // Parse address if it's a string
    const addressObj =
      typeof address === "string" ? JSON.parse(address) : address;

    const updateData = {
      name,
      gender,
      age,
      address: addressObj,
      aadharNumber,
      designation,
    };

    const staff = await StaffDetails.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // If new file is uploaded
    if (req.file) {
      // Delete old image from S3 if exists
      if (staff.profilePicture?.public_id) {
        await deleteFromS3(staff.profilePicture.public_id);
      }

      // Upload new image
      const result = await uploadToS3(req.file);
      updateData.profilePicture = {
        public_id: result.Key,
        url: result.Location,
      };
    }

    const updatedStaff = await StaffDetails.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      staff: updatedStaff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete staff
export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await StaffDetails.findById(id);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff not found",
            });
        }

        // Delete profile picture from S3 if exists
        if (staff.profilePicture?.public_id) {
            await deleteFromS3(staff.profilePicture.public_id);
        }

        await StaffDetails.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Staff deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};