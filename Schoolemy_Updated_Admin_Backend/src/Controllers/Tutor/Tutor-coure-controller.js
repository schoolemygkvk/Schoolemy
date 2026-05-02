
import Course from "../../Models/Tutor/Tutor-CourseModel.js";
import Tutor from "../../Models/Tutor/TutorModel.js";

import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../DB/adudios3.js";
import path from "path";
import { URL } from "url";
import mongoose from "mongoose";
import { fixUtf8InObject, decodeUtf8Text } from "../../Utils/utf8Helper.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Upload file to S3
const uploadToS3 = async (file, folder, rawName = null) => {
  const ext = path.extname(file.originalname);
  
  // Helper function to detect and fix latin1-encoded UTF-8 filenames
  const fixLatinEncodedUtf8 = (filename) => {
    // Use the existing utility function for consistent handling
    return decodeUtf8Text(filename);
  };
  
  // Fix the original filename encoding if needed
  const correctedOriginalName = fixLatinEncodedUtf8(file.originalname);
  
  // Use rawName if provided, otherwise use corrected original file name
  let baseName;
  if (rawName && typeof rawName === "string" && rawName.trim()) {
    // Also fix rawName encoding if it has issues
    const correctedRawName = fixLatinEncodedUtf8(rawName.trim());
    baseName = path.basename(correctedRawName, path.extname(correctedRawName));
  } else {
    baseName = path.basename(correctedOriginalName, ext);
  }

  // Preserve the exact name as provided (now properly UTF-8 encoded)
  const filename = `${baseName}${ext}`;
  
  // Encode the key properly for S3 to handle Unicode characters
  const Key = `${folder}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_TUTOR,
    Key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // Preserve original filename with UTF-8 encoding for downloads
    ContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
  });

  try {
    await s3.send(command);
    
    // Construct URL with proper encoding
    // Split the Key into folder and filename parts
    const keyParts = Key.split('/');
    const encodedKeyParts = keyParts.map(part => encodeURIComponent(part));
    const encodedKey = encodedKeyParts.join('/');
    
    const s3Url = `https://${process.env.AWS_S3_BUCKET_TUTOR}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodedKey}`;
    
    // Return the original filename (preserving UTF-8 characters)
    return {
      name: filename,
      originalName: baseName,
      url: s3Url,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

// ===================== Admin Review Controllers =====================

// Helper to ensure only admin / course managers can perform review actions
const ensureAdminReviewer = (req, res) => {
  const role = req.user?.role;
  const allowedRoles = ["superadmin", "admin", "coursemanagement"];
  if (!role || !allowedRoles.includes(role)) {
    res
      .status(403)
      .json({ success: false, error: "Forbidden: admin access required" });
    return false;
  }
  return true;
};

// List tutor courses that are waiting for admin review
export const listPendingTutorCourses = async (req, res) => {
  try {
    if (!ensureAdminReviewer(req, res)) return;

    const courses = await Course.find({
      status: "pending_review",
      $or: [{ isDeleted: { $exists: false } }, { isDeleted: { $ne: true } }],
    })
      .populate("tutor", "name email")
      .select(
        "coursename category courseduration level language certificates createdAt tutor status"
      );

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Error listing pending tutor courses:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch pending courses" });
  }
};

// Approve a tutor course
export const approveTutorCourse = async (req, res) => {
  try {
    if (!ensureAdminReviewer(req, res)) return;

    const { id } = req.params;
    const { reviewComment = "" } = req.body || {};

    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    // Normalize old field names to new field names
    if (!course.courseDuration) {
      course.courseDuration = course.courseduration || "6 months";
    }
    if (!course.contentDuration) {
      course.contentDuration = course.contentduration || { hours: 0, minutes: 0 };
    }
    if (course.previewVideo && !course.previewvideo) {
      course.previewvideo = course.previewVideo;
    }

    // Normalize lesson field names in chapters
    if (course.chapters && Array.isArray(course.chapters)) {
      course.chapters.forEach(chapter => {
        if (chapter.lessons && Array.isArray(chapter.lessons)) {
          chapter.lessons.forEach(lesson => {
            // Map old field names to new ones
            if (lesson.lessonname && !lesson.lessonName) {
              lesson.lessonName = lesson.lessonname;
            }
            if (lesson.audio && !lesson.audioFile) {
              lesson.audioFile = lesson.audio;
            }
            if (lesson.video && !lesson.videoFile) {
              lesson.videoFile = lesson.video;
            }
            if (lesson.pdf && !lesson.pdfFile) {
              lesson.pdfFile = lesson.pdf;
            }
            // Ensure lessonName is not empty
            if (!lesson.lessonName) {
              lesson.lessonName = "Lesson";
            }
          });
        }
      });
    }

    course.status = "approved";
    course.reviewComment = reviewComment;
    course.reviewedBy = req.user.id;
    course.reviewedAt = new Date();

    course.statusHistory = [
      ...(course.statusHistory || []),
      {
        status: "approved",
        comment: reviewComment,
        adminId: req.user.id,
        at: new Date(),
      },
    ];

    await course.save();

    return res.status(200).json({
      success: true,
      message: "Course approved successfully",
      course: { _id: course._id, coursename: course.coursename, status: course.status }
    });
  } catch (error) {
    console.error("Error approving tutor course:", error);
    const errorMessage = error.message || error.toString();
    return res
      .status(500)
      .json({ success: false, error: "Failed to approve course", details: errorMessage });
  }
};

// Request changes for a tutor course
export const requestChangesForTutorCourse = async (req, res) => {
  try {
    if (!ensureAdminReviewer(req, res)) return;

    const { id } = req.params;
    const { reviewComment } = req.body || {};

    if (!reviewComment || !reviewComment.trim()) {
      return res.status(400).json({
        success: false,
        error: "reviewComment is required to request changes",
      });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    // Normalize old field names to new field names
    if (!course.courseDuration) {
      course.courseDuration = course.courseduration || "6 months";
    }
    if (!course.contentDuration) {
      course.contentDuration = course.contentduration || { hours: 0, minutes: 0 };
    }
    if (course.previewVideo && !course.previewvideo) {
      course.previewvideo = course.previewVideo;
    }

    // Normalize lesson field names in chapters
    if (course.chapters && Array.isArray(course.chapters)) {
      course.chapters.forEach(chapter => {
        if (chapter.lessons && Array.isArray(chapter.lessons)) {
          chapter.lessons.forEach(lesson => {
            // Map old field names to new ones
            if (lesson.lessonname && !lesson.lessonName) {
              lesson.lessonName = lesson.lessonname;
            }
            if (lesson.audio && !lesson.audioFile) {
              lesson.audioFile = lesson.audio;
            }
            if (lesson.video && !lesson.videoFile) {
              lesson.videoFile = lesson.video;
            }
            if (lesson.pdf && !lesson.pdfFile) {
              lesson.pdfFile = lesson.pdf;
            }
            // Ensure lessonName is not empty
            if (!lesson.lessonName) {
              lesson.lessonName = "Lesson";
            }
          });
        }
      });
    }

    course.status = "changes_requested";
    course.reviewComment = reviewComment;
    course.reviewedBy = req.user.id;
    course.reviewedAt = new Date();

    course.statusHistory = [
      ...(course.statusHistory || []),
      {
        status: "changes_requested",
        comment: reviewComment,
        adminId: req.user.id,
        at: new Date(),
      },
    ];

    await course.save();

    return res.status(200).json({
      success: true,
      message: "Changes requested from tutor successfully",
      course: { _id: course._id, coursename: course.coursename, status: course.status }
    });
  } catch (error) {
    console.error("Error requesting changes for tutor course:", error);
    const errorMessage = error.message || error.toString();
    return res
      .status(500)
      .json({ success: false, error: "Failed to request changes", details: errorMessage });
  }
};

// Reject a tutor course
export const rejectTutorCourse = async (req, res) => {
  try {
    if (!ensureAdminReviewer(req, res)) return;

    const { id } = req.params;
    const { reviewComment } = req.body || {};

    if (!reviewComment || !reviewComment.trim()) {
      return res.status(400).json({
        success: false,
        error: "reviewComment is required to reject a course",
      });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    // Normalize old field names to new field names
    if (!course.courseDuration) {
      course.courseDuration = course.courseduration || "6 months";
    }
    if (!course.contentDuration) {
      course.contentDuration = course.contentduration || { hours: 0, minutes: 0 };
    }
    if (course.previewVideo && !course.previewvideo) {
      course.previewvideo = course.previewVideo;
    }

    // Normalize lesson field names in chapters
    if (course.chapters && Array.isArray(course.chapters)) {
      course.chapters.forEach(chapter => {
        if (chapter.lessons && Array.isArray(chapter.lessons)) {
          chapter.lessons.forEach(lesson => {
            // Map old field names to new ones
            if (lesson.lessonname && !lesson.lessonName) {
              lesson.lessonName = lesson.lessonname;
            }
            if (lesson.audio && !lesson.audioFile) {
              lesson.audioFile = lesson.audio;
            }
            if (lesson.video && !lesson.videoFile) {
              lesson.videoFile = lesson.video;
            }
            if (lesson.pdf && !lesson.pdfFile) {
              lesson.pdfFile = lesson.pdf;
            }
            // Ensure lessonName is not empty
            if (!lesson.lessonName) {
              lesson.lessonName = "Lesson";
            }
          });
        }
      });
    }

    course.status = "rejected";
    course.reviewComment = reviewComment;
    course.reviewedBy = req.user.id;
    course.reviewedAt = new Date();

    course.statusHistory = [
      ...(course.statusHistory || []),
      {
        status: "rejected",
        comment: reviewComment,
        adminId: req.user.id,
        at: new Date(),
      },
    ];

    await course.save();

    return res.status(200).json({
      success: true,
      message: "Course rejected successfully",
      course: { _id: course._id, coursename: course.coursename, status: course.status }
    });
  } catch (error) {
    console.error("Error rejecting tutor course:", error);
    const errorMessage = error.message || error.toString();
    return res
      .status(500)
      .json({ success: false, error: "Failed to reject course", details: errorMessage });
  }
};

const generateCourseMotherId = (coursename, courseduration) => {
  // Sanitize & create abbreviation
  const nameAbbreviation = coursename
    .split(/\s+/)
    .map((word) => word[0]) // Take first letter of each word
    .join("")
    .toUpperCase()
    .substring(0, 10); // Optional: limit max length

  const durationMap = {
    "6 months": "6M",
    "1 year": "1Y",
    "2 years": "2Y",
  };

  const durationCode = durationMap[courseduration] || "XX";
  const id = `${nameAbbreviation}-${durationCode}`;
  return id;
};

// Create Course
export const createCourse = async (req, res) => {
  try {
    // Fix UTF-8 encoding issues in the entire request body
    const fixedBody = fixUtf8InObject(req.body);
    
    const {
      coursename,
      category,
      courseduration,
      CourseMotherId,
      useAutoCourseMotherId,
      tutorObjectId, // Changed from tutorId to tutorObjectId
    } = fixedBody;

    if (!mongoose.Types.ObjectId.isValid(tutorObjectId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid tutor ID format"
      });
    }

    // Find tutor by ObjectId
    const tutor = await Tutor.findById(tutorObjectId);

    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: "Tutor not found"
      });
    }
    
    // Auto-generate CourseMotherId if useAutoCourseMotherId is true or CourseMotherId is not provided
    let finalCourseMotherId = CourseMotherId;
    if (useAutoCourseMotherId === "true" || !CourseMotherId) {
      finalCourseMotherId = generateCourseMotherId(coursename, courseduration);
    }

    if (!coursename || !category || !courseduration) {
      return res.status(400).json({
        error: "coursename, category, and courseduration are required",
      });
    }

    const existing = await Course.findOne({ coursename });
    if (existing)
      return res.status(400).json({ error: "Course already exists" });

    const courseFolder = coursename.toLowerCase().replace(/\s+/g, "-");
    const files = req.files || [];

    const fileMap = {};

    // Upload each file and categorize
    for (const file of files) {
      const field = file.fieldname;
      let folder = "misc";

      if (field.includes("previewvideo")) folder = "preview";
      else if (field.includes("thumbnail")) folder = "thumbnail";
      else if (field.includes("audio")) folder = "audio";
      else if (field.includes("video")) folder = "video";
      else if (field.includes("pdf")) folder = "pdf";

      // Extract raw name from body
      let rawName = null;
      const match = field.match(
        /chapters\[(\d+)\]\.lessons\[(\d+)\]\.(audio|video|pdf)/
      );
      if (match) {
        const [_, chIdx, lsnIdx, type] = match;
        const key = `chapters[${chIdx}].lessons[${lsnIdx}].${type}name`;
        const val = fixedBody[key]; // Use fixed body with UTF-8 encoding
        
        // Get current file index for this field
        const currentFileIndex = fileMap[field]?.length || 0;
        
        if (Array.isArray(val)) {
          // If it's already an array, use the index
          rawName = val[currentFileIndex];
        } else if (typeof val === 'string' && val.includes(',')) {
          // If it's a comma-separated string, split it and use the index
          const names = val.split(',').map(name => name.trim()).filter(name => name);
          rawName = names[currentFileIndex] || null;
        } else {
          // Single value
          rawName = val;
        }
      }

      const uploadResult = await uploadToS3(
        file,
        `${courseFolder}/${folder}`,
        rawName
      );

      if (!fileMap[field]) fileMap[field] = [];
      // uploadResult.name already contains the custom name with extension from uploadToS3
      fileMap[field].push({ 
        name: uploadResult.name,
        url: uploadResult.url 
      });
    }

    // Build chapters & lessons
    const chapters = [];
    let chapterIndex = 0;

    while (fixedBody[`chapters[${chapterIndex}].title`]) {
      const title = fixedBody[`chapters[${chapterIndex}].title`];
      const lessons = [];

      let lessonIndex = 0;
      while (
        fixedBody[`chapters[${chapterIndex}].lessons[${lessonIndex}].lessonname`]
      ) {
        const base = `chapters[${chapterIndex}].lessons[${lessonIndex}]`;
        const lessonData = {
          lessonname: fixedBody[`${base}.lessonname`],
          audioFile: fileMap[`${base}.audio`] || [],
          videoFile: fileMap[`${base}.video`] || [],
          pdfFile: fileMap[`${base}.pdf`] || [],
        };
        
        lessons.push(lessonData);

        lessonIndex++;
      }

      chapters.push({ title, lessons });
      chapterIndex++;
    }

    // Handle price
    const amount = parseFloat(fixedBody["price.amount"]) || 0;
    const discount = parseFloat(fixedBody["price.discount"]) || 0;
    const finalPrice = amount * (1 - discount / 100);

    // Assemble course
    const course = new Course({
      tutor: tutor._id, // Add reference to tutor
      CourseMotherId: finalCourseMotherId,
      coursename,
      category,
      courseDuration: courseduration,
      thumbnail: fileMap["thumbnail"]?.[0]?.url || fixedBody.thumbnail || "",
      previewvideo: fileMap["previewvideo"]?.[0]?.url || "",
      contentDuration: {
        hours: parseInt(fixedBody["contentduration.hours"]) || 0,
        minutes: parseInt(fixedBody["contentduration.minutes"]) || 0,
      },
      chapters,
      price: {
        amount,
        currency: fixedBody["price.currency"] || "INR",
        discount,
        finalPrice,
      },
      level: fixedBody.level,
      language: fixedBody.language,
      certificates: fixedBody.certificates,
      instructor: {
        name: fixedBody["instructor.name"],
        role: fixedBody["instructor.role"],
        socialmedia_id: fixedBody["instructor.socialmedia_id"],
      },
      description: fixedBody.description || "",
      whatYoullLearn: Array.isArray(fixedBody.whatYoullLearn)
        ? fixedBody.whatYoullLearn
        : typeof fixedBody.whatYoullLearn === "string"
        ? fixedBody.whatYoullLearn.split(",")
        : [],
      // Initial admin review status
      status: "pending_review",
      reviewComment: "",
      reviewedBy: null,
      reviewedAt: null,
    });

    const saved = await course.save();
    
    // Increment tutor's course count
    await Tutor.findByIdAndUpdate(tutor._id, {
      $inc: { totalCoursesUploaded: 1 }
    });
    
    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: {
        courseId: saved._id,
        CourseMotherId: saved.CourseMotherId,
        coursename: saved.coursename,
        status: saved.status,
      },
    });
  } catch (error) {
    console.error("Course creation failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


export const createCourseWithS3UrlsForTutor = async (req, res) => {
  try {
    const fixedBody = fixUtf8InObject(req.body);
    const {
      tutorObjectId,
      coursename,
      category,
      courseDuration,
      CourseMotherId,
      useAutoCourseMotherId,
      thumbnail,
      previewvideo,
      contentDuration,
      chapters,
      price,
      level,
      language,
      certificates,
      description,
      whatYoullLearn,
      instructor,
      emi,
    } = fixedBody;

    if (!mongoose.Types.ObjectId.isValid(tutorObjectId)) {
      return res.status(400).json({ success: false, error: "Invalid tutor ID format" });
    }

    const tutor = await Tutor.findById(tutorObjectId);
    if (!tutor) {
      return res.status(404).json({ success: false, error: "Tutor not found" });
    }

    let finalCourseMotherId = CourseMotherId;
    if (useAutoCourseMotherId === true || useAutoCourseMotherId === "true" || !CourseMotherId) {
      finalCourseMotherId = generateCourseMotherId(coursename, courseDuration);
    }

    if (!coursename || !category || !courseDuration) {
      return res.status(400).json({
        success: false,
        error: "coursename, category, and courseDuration are required",
      });
    }

    const existing = await Course.findOne({ coursename });
    if (existing) {
      return res.status(400).json({ success: false, error: "Course already exists" });
    }

    const amount = parseFloat(price?.amount) || 0;
    const discount = parseFloat(price?.discount) || 0;
    const finalPrice = amount * (1 - discount / 100);

    const course = new Course({
      tutor: tutor._id,
      CourseMotherId: finalCourseMotherId,
      coursename,
      category,
      courseDuration,
      thumbnail: thumbnail || "",
      previewvideo: previewvideo || "",
      contentDuration: {
        hours: parseInt(contentDuration?.hours) || 0,
        minutes: parseInt(contentDuration?.minutes) || 0,
      },
      chapters: chapters || [],
      price: {
        amount,
        currency: price?.currency || "INR",
        discount,
        finalPrice,
      },
      level: level || "beginner",
      language: language || "english",
      certificates: certificates || "yes",
      instructor: instructor || { name: "", role: "", socialmedia_id: "" },
      description: description || "",
      whatYoullLearn: Array.isArray(whatYoullLearn) ? whatYoullLearn : [],
      status: "pending_review",
      reviewComment: "",
      reviewedBy: null,
      reviewedAt: null,
    });

    const saved = await course.save();
    await Tutor.findByIdAndUpdate(tutor._id, { $inc: { totalCoursesUploaded: 1 } });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: {
        courseId: saved._id,
        CourseMotherId: saved.CourseMotherId,
        coursename: saved.coursename,
        status: saved.status,
      },
    });
  } catch (error) {
    console.error("Tutor course creation with S3 URLs failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get courses name
export const getCourseNames = async (req, res) => {
  try {
    const courses = await Course.find({}, "_id coursename chapters.title");
    
    // Optional: Format the response if needed
    const formattedCourses = courses.map((course) => ({
      _id: course._id,
      courseId: course._id,
      coursename: course.coursename,
      chapters: course.chapters.map((chapter) => chapter.title),
    }));

    res.status(200).json(formattedCourses);
  } catch (error) {
    console.error("Failed to get course names:", error);
    res.status(500).json({ error: "Failed to fetch course names" });
  }
};

// Get courses
export const getCourseByName = async (req, res) => {
  try {
    const { coursename } = req.params;

    if (!coursename) {
      return res.status(400).json({ error: "coursename is required" });
    }

    const course = await Course.findOne({ coursename });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("❌ Error fetching course:", error);
    sendError(res, 500, "Internal Server Error", { details: error.message });
  }
};

// Get courses by tutor
export const getCoursesByTutor = async (req, res) => {
  try {
    // Use authenticated user id from token (req.user is set by verifyToken middleware)
    const tutorParam = req.user?.id;

    if (!tutorParam) {
      return res.status(401).json({ success: false, error: "Unauthorized: tutor id not found in token" });
    }

    if (!mongoose.Types.ObjectId.isValid(tutorParam)) {
      return res.status(400).json({ error: "Invalid tutor id format" });
    }

    // Optionally ensure the tutor exists
    const tutorExists = await Tutor.findById(tutorParam).select("_id name email");
    if (!tutorExists) {
      return res.status(404).json({ success: false, error: "Tutor not found" });
    }

    const courses = await Course.find({ tutor: tutorParam })
      .populate("tutor", "name email")
      .select(
        "coursename category courseduration level language certificates status reviewComment reviewedAt createdAt updatedAt"
      );

    if (!courses || courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No courses found for tutor: ${tutorParam}`,
      });
    }

    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    console.error("Error fetching courses by tutor:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get courses by tutor name (without authentication)
export const getCoursesByTutorname = async (req, res) => {
  try {
    // Get tutor name from params
    const { tutorname } = req.params;

    if (!tutorname) {
      return res.status(400).json({ success: false, error: "Tutor name is required" });
    }

    // Find tutor by name (case-insensitive search)
    const tutor = await Tutor.findOne({ 
      name: { $regex: new RegExp(`^${tutorname}$`, "i") } 
    }).select("_id name email");

    if (!tutor) {
      return res.status(404).json({ success: false, error: "Tutor not found" });
    }

    // Find courses for this tutor
    const courses = await Course.find({ tutor: tutor._id })
      .populate("tutor", "name email")
      .select(
        "coursename category courseduration level language certificates status reviewComment reviewedAt createdAt updatedAt"
      );

    if (!courses || courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No courses found for tutor: ${tutorname}`,
      });
    }

    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    console.error("Error fetching courses by tutor name:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete file from S3
const deleteFromS3 = async (fileUrl) => {
  try {
    const parsedUrl = new URL(fileUrl);
    const Key = parsedUrl.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_TUTOR,
      Key,
    });

    await s3.send(command);
    return true;
  } catch (error) {
    console.error(`Error deleting file from S3:`, error);
    return false;
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    // Ensure UTF-8 response
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // Fix UTF-8 encoding issues in the entire request body
    const fixedBody = fixUtf8InObject(req.body);
    
    const courseName = req.params.coursename;
    const existingCourse = await Course.findOne({ coursename: courseName });

    if (!existingCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    const courseFolder = existingCourse.coursename
      .toLowerCase()
      .replace(/\s+/g, "-");
    const files = req.files || [];
    const fileMap = {};
    
    // Parse filesToDelete - handle string, array, or undefined
    let filesToDelete = [];
    try {
      if (fixedBody.filesToDelete) {
        if (typeof fixedBody.filesToDelete === 'string') {
          // Single JSON string
          filesToDelete = [JSON.parse(fixedBody.filesToDelete)];
        } else if (Array.isArray(fixedBody.filesToDelete)) {
          // Array of strings (each is JSON) or array of objects
          filesToDelete = fixedBody.filesToDelete.map(item => 
            typeof item === 'string' ? JSON.parse(item) : item
          );
        }
      }
    } catch (error) {
      console.error('Error parsing filesToDelete:', error);
      filesToDelete = [];
    }

    // Step 1: Delete requested files from S3
    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map(async (fileData) => {
          try {
            const file =
              typeof fileData === "string" ? JSON.parse(fileData) : fileData;
            if (!file.url) return;
            await deleteFromS3(file.url);
          } catch (error) {
            console.error(`Error processing file deletion:`, error);
          }
        })
      );
    }

    // Step 2: Upload new files to S3
    for (const file of files) {
      const field = file.fieldname;
      let folder = "misc";

      // Determine folder based on file type
      if (field.includes("previewvideo")) folder = "preview";
      else if (field.includes("thumbnail")) folder = "thumbnail";
      else if (field.includes("audio")) folder = "audio";
      else if (field.includes("video")) folder = "video";
      else if (field.includes("pdf")) folder = "pdf";

      let rawName = null;
      const match = field.match(
        /chapters\[(\d+)\]\.lessons\[(\d+)\]\.(audio|video|pdf)File/
      );

      if (match) {
        const [_, chIdx, lsnIdx, type] = match;
        // The custom name field is sent as 'audioname', 'videoname', 'pdfname' (without 'File')
        const key = `chapters[${chIdx}].lessons[${lsnIdx}].${type}name`;
        const val = fixedBody[key]; // Use fixed body with UTF-8 encoding
        
        // Get current file index for this field
        const currentFileIndex = fileMap[field]?.length || 0;
        
        if (Array.isArray(val)) {
          // If it's already an array, use the index
          rawName = val[currentFileIndex];
        } else if (typeof val === 'string' && val.includes(',')) {
          // If it's a comma-separated string, split it and use the index
          const names = val.split(',').map(name => name.trim()).filter(name => name);
          rawName = names[currentFileIndex] || null;
        } else {
          // Single value
          rawName = val;
        }
      }

      const uploadResult = await uploadToS3(
        file,
        `${courseFolder}/${folder}`,
        rawName
      );

      if (!fileMap[field]) fileMap[field] = [];
      // uploadResult.name already contains the custom name with extension from uploadToS3
      fileMap[field].push({
        name: uploadResult.name,
        url: uploadResult.url
      });
    }

    // Step 3: Rebuild course structure
    const updatedChapters = [];
    let chapterIndex = 0;

    while (fixedBody[`chapters[${chapterIndex}].title`] !== undefined) {
      const title = fixedBody[`chapters[${chapterIndex}].title`];
      const lessons = [];

      let lessonIndex = 0;
      while (
        fixedBody[
          `chapters[${chapterIndex}].lessons[${lessonIndex}].lessonname`
        ] !== undefined
      ) {
        const base = `chapters[${chapterIndex}].lessons[${lessonIndex}]`;

        // Get existing lesson or create new one
        const existingLesson = existingCourse.chapters[chapterIndex]?.lessons[
          lessonIndex
        ] || { audioFile: [], videoFile: [], pdfFile: [] };

        // Filter out deleted files and add new ones
        const lessonData = {
          lessonname: fixedBody[`${base}.lessonname`],
          audioFile: [
            ...(existingLesson.audioFile || []).filter(
              (file) => !filesToDelete.some((f) => f.url === file.url)
            ),
            ...(fileMap[`${base}.audioFile`] || []),
          ],
          videoFile: [
            ...(existingLesson.videoFile || []).filter(
              (file) => !filesToDelete.some((f) => f.url === file.url)
            ),
            ...(fileMap[`${base}.videoFile`] || []),
          ],
          pdfFile: [
            ...(existingLesson.pdfFile || []).filter(
              (file) => !filesToDelete.some((f) => f.url === file.url)
            ),
            ...(fileMap[`${base}.pdfFile`] || []),
          ],
        };

        lessons.push(lessonData);
        lessonIndex++;
      }

      updatedChapters.push({ title, lessons });
      chapterIndex++;
    }

    // Step 4: Update course metadata
    existingCourse.coursename =
      fixedBody.coursename || existingCourse.coursename;
    existingCourse.category = fixedBody.category || existingCourse.category;
    existingCourse.courseDuration =
      fixedBody.courseduration || existingCourse.courseDuration;

    // Handle thumbnail update/removal
    if (fileMap["thumbnail"]?.[0]) {
      existingCourse.thumbnail = fileMap["thumbnail"][0].url;
    } else if (fixedBody.thumbnail === "") {
      // If thumbnail was explicitly set to empty, remove it
      if (existingCourse.thumbnail) {
        await deleteFromS3(existingCourse.thumbnail);
      }
      existingCourse.thumbnail = undefined;
    }

    // Handle preview video update/removal
    if (fileMap["previewvideo"]?.[0]) {
      existingCourse.previewvideo = fileMap["previewvideo"][0].url;
    } else if (fixedBody.previewvideo === "") {
      // If preview video was explicitly set to empty, remove it
      if (existingCourse.previewvideo) {
        await deleteFromS3(existingCourse.previewvideo);
      }
      existingCourse.previewvideo = undefined;
    }

    // Update other fields
    existingCourse.contentDuration = {
      hours:
        parseInt(fixedBody["contentduration.hours"]) ||
        existingCourse.contentDuration.hours ||
        0,
      minutes:
        parseInt(fixedBody["contentduration.minutes"]) ||
        existingCourse.contentDuration.minutes ||
        0,
    };

    existingCourse.level = fixedBody.level || existingCourse.level;
    existingCourse.language = fixedBody.language || existingCourse.language;
    existingCourse.certificates =
      fixedBody.certificates || existingCourse.certificates;

    existingCourse.instructor = {
      name: fixedBody["instructor.name"] || existingCourse.instructor?.name,
      role: fixedBody["instructor.role"] || existingCourse.instructor?.role,
      socialmedia_id:
        fixedBody["instructor.socialmedia_id"] ||
        existingCourse.instructor?.socialmedia_id,
    };

    existingCourse.description =
      fixedBody.description || existingCourse.description;

    if (fixedBody.whatYoullLearn) {
      existingCourse.whatYoullLearn = Array.isArray(fixedBody.whatYoullLearn)
        ? fixedBody.whatYoullLearn
        : fixedBody.whatYoullLearn.split(",").map((item) => item.trim());
    }

    // Update pricing
    const amount =
      parseFloat(fixedBody["price.amount"]) || existingCourse.price.amount;
    const discount =
      parseFloat(fixedBody["price.discount"]) ||
      existingCourse.price.discount ||
      0;

    existingCourse.price = {
      amount,
      currency:
        fixedBody["price.currency"] || existingCourse.price.currency || "INR",
      discount,
      finalPrice: amount * (1 - discount / 100),
    };

    // Update chapters
    if (updatedChapters.length > 0) {
      existingCourse.chapters = updatedChapters;
    }

    // Save the updated course
    // If tutor has updated a course that previously had changes requested,
    // move it back to pending_review and clear previous review metadata.
    if (existingCourse.status === "changes_requested") {
      existingCourse.status = "pending_review";
      existingCourse.reviewComment = "";
      existingCourse.reviewedBy = null;
      existingCourse.reviewedAt = null;

      existingCourse.statusHistory = [
        ...(existingCourse.statusHistory || []),
        {
          status: "pending_review",
          comment: "Tutor updated course after changes requested",
          adminId: null,
          at: new Date(),
        },
      ];
    }

    const updatedCourse = await existingCourse.save();
    
    // Fix UTF-8 encoding in response
    const fixedCourse = fixUtf8InObject(updatedCourse.toObject());

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course: fixedCourse,
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


export const updateCourseWithS3UrlsForTutor = async (req, res) => {
  try {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    const courseName = decodeURIComponent(req.params.coursename);
    const fixedBody = fixUtf8InObject(req.body);

    const existingCourse = await Course.findOne({ coursename: courseName });
    if (!existingCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    let filesToDelete = [];
    try {
      if (fixedBody.filesToDelete) {
        const raw = fixedBody.filesToDelete;
        filesToDelete = Array.isArray(raw)
          ? raw.map((f) => (typeof f === "string" ? JSON.parse(f) : f))
          : typeof raw === "string"
          ? [JSON.parse(raw)]
          : [];
      }
    } catch (e) {
      filesToDelete = [];
    }

    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map(async (file) => {
          if (file && file.url) {
            try {
              await deleteFromS3(file.url);
            } catch (err) {
              console.error("Delete S3 file:", err);
            }
          }
        })
      );
    }

    const updatedChapters = [];
    (fixedBody.chapters || []).forEach((chapter, chIdx) => {
      const lessons = (chapter.lessons || []).map((lesson) => ({
        lessonName:
          lesson.lessonName ||
          lesson.lessonname ||
          "",
        audioFile: lesson.audioFile || [],
        videoFile: lesson.videoFile || [],
        pdfFile: lesson.pdfFile || [],
      }));
      updatedChapters.push({ title: chapter.title, lessons });
    });

    if (fixedBody.coursename) existingCourse.coursename = fixedBody.coursename;
    if (fixedBody.category) existingCourse.category = fixedBody.category;
    const duration =
      fixedBody.courseduration ||
      fixedBody.courseDuration;
    if (duration) existingCourse.courseDuration = duration;
    if (fixedBody.level) existingCourse.level = fixedBody.level;
    if (fixedBody.language) existingCourse.language = fixedBody.language;
    if (fixedBody.certificates) existingCourse.certificates = fixedBody.certificates;
    if (fixedBody.description !== undefined) existingCourse.description = fixedBody.description;
    if (fixedBody.whatYoullLearn) {
      existingCourse.whatYoullLearn = Array.isArray(fixedBody.whatYoullLearn)
        ? fixedBody.whatYoullLearn
        : fixedBody.whatYoullLearn.split(",").map((s) => s.trim());
    }
    const contentDur =
      fixedBody.contentduration || fixedBody.contentDuration;
    if (contentDur) {
      existingCourse.contentDuration = {
        hours: parseInt(contentDur.hours) || 0,
        minutes: parseInt(contentDur.minutes) || 0,
      };
    }
    if (fixedBody.price) {
      const amount = parseFloat(fixedBody.price.amount) || 0;
      const discount = parseFloat(fixedBody.price.discount) || 0;
      existingCourse.price = {
        amount,
        currency: fixedBody.price.currency || "INR",
        discount,
        finalPrice: amount * (1 - discount / 100),
      };
    }
    if (fixedBody.thumbnail) existingCourse.thumbnail = fixedBody.thumbnail;
    if (fixedBody.previewVideo && fixedBody.previewVideo[0]?.url) {
      existingCourse.previewvideo = fixedBody.previewVideo[0].url;
    } else if (fixedBody.previewvideo) {
      existingCourse.previewvideo = fixedBody.previewvideo;
    }
    if (updatedChapters.length > 0) existingCourse.chapters = updatedChapters;

    if (existingCourse.status === "changes_requested") {
      existingCourse.status = "pending_review";
      existingCourse.reviewComment = "";
      existingCourse.reviewedBy = null;
      existingCourse.reviewedAt = null;
    }

    await existingCourse.save();
    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course: fixUtf8InObject(existingCourse.toObject()),
    });
  } catch (error) {
    console.error("Update course with S3 URLs error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete course function (was missing)
export const deleteCourse = async (req, res) => {
  try {
    const { coursename } = req.params;
    const { hard = false } = req.query;

    if (!coursename) {
      return res.status(400).json({
        success: false,
        error: "coursename is required",
      });
    }

    const course = await Course.findOne({ coursename });
    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    if (hard === "true") {
      // Hard delete: Remove from database and clean up S3 files
      const deletePromises = [];

      if (course.thumbnail) deletePromises.push(deleteFromS3(course.thumbnail));
      if (course.previewvideo)
        deletePromises.push(deleteFromS3(course.previewvideo));

      course.chapters.forEach((chapter) => {
        chapter.lessons.forEach((lesson) => {
          lesson.audioFile.forEach((file) =>
            deletePromises.push(deleteFromS3(file.url))
          );
          lesson.videoFile.forEach((file) =>
            deletePromises.push(deleteFromS3(file.url))
          );
          lesson.pdfFile.forEach((file) =>
            deletePromises.push(deleteFromS3(file.url))
          );
        });
      });

      await Promise.allSettled(deletePromises);
      await Course.findByIdAndDelete(course._id);

      res.status(200).json({
        success: true,
        message: "Course permanently deleted successfully",
      });
    } else {
      // Soft delete
      course.isDeleted = true;
      course.deletedAt = new Date();
      await course.save();

      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    }
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get courses by category
export const getCoursesByCategory = async (req, res) => {
  try {
    // URL-லிருந்து category பெயரைப் பெறுகிறோம் (e.g., "Yoga", "Siddha Medicine")
    const { categoryName } = req.params;

    if (!categoryName) {
      return res.status(400).json({ error: "Category name is required" });
    }
    
    // category ஃபீல்டை வைத்து டேட்டாபேஸில் தேடுகிறோம்
    const courses = await Course.find({
      category: categoryName,
      status: "approved",
    });

    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: `No courses found for category: ${categoryName}` });
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });

  } catch (error) {
    console.error(`Error fetching courses by category: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteTutorCourseById = async (req, res) => {
  try {
    if (!ensureAdminReviewer(req, res)) return;

    const { id } = req.params;
    const { hard = "false" } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Course ID is required",
      });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    if (hard === "true") {
      const deletePromises = [];
      if (course.thumbnail) deletePromises.push(deleteFromS3(course.thumbnail));
      if (course.previewvideo)
        deletePromises.push(deleteFromS3(course.previewvideo));
      (course.chapters || []).forEach((chapter) => {
        (chapter.lessons || []).forEach((lesson) => {
          (lesson.audioFile || []).forEach((file) =>
            deletePromises.push(deleteFromS3(file?.url))
          );
          (lesson.videoFile || []).forEach((file) =>
            deletePromises.push(deleteFromS3(file?.url))
          );
          (lesson.pdfFile || []).forEach((file) =>
            deletePromises.push(deleteFromS3(file?.url))
          );
        });
      });
      await Promise.allSettled(deletePromises);
      await Course.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: "Course permanently deleted successfully",
      });
    }

    course.isDeleted = true;
    course.deletedAt = new Date();
    await course.save();
    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete tutor course error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};