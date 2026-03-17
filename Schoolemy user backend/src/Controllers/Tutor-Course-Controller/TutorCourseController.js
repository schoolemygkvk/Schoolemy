import mongoose from "mongoose";
import TutorCourse from "../../Models/Tutor-Course/Tutor-course-model.js";

// Get all approved tutor courses (strict: only status === "approved")
export const getApprovedTutorCourses = async (req, res) => {
  try {
    // Fetch full documents from DB (no field projection), only status filter
    const courses = await TutorCourse.find({ status: "approved" }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Approved tutor courses fetched successfully",
      data: courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching approved tutor courses",
      error: error.message,
    });
  }
};

// Get approved tutor courses filtered by category
export const getApprovedTutorCoursesByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;

    if (!categoryName) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const courses = await TutorCourse.find({
      status: "approved",
      category: categoryName,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Approved tutor courses for the category fetched successfully",
      data: courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching approved tutor courses for the category",
      error: error.message,
    });
  }
};

// Get approved tutor course by ID
export const getApprovedTutorCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    // Validate if courseId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    const course = await TutorCourse.findOne({
      _id: courseId,
      status: "approved",
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Approved tutor course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Approved tutor course fetched successfully",
      data: course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching approved tutor course",
      error: error.message,
    });
  }
};

// Get tutor courses by tutor ID
export const getTutorCoursesByTutorId = async (req, res) => {
  try {
    const { tutorId } = req.params;

    if (!tutorId) {
      return res.status(400).json({
        success: false,
        message: "Tutor ID is required",
      });
    }

    // Validate if tutorId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tutor ID format",
      });
    }

    const courses = await TutorCourse.find({
      tutor: tutorId,
      status: "approved",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Tutor courses fetched successfully",
      data: courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching tutor courses",
      error: error.message,
    });
  }
};

// Get tutor course content by ID (chapters, lessons, and exam data)
export const getTutorCourseContent = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    // Validate if courseId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    // Fetch course with populated exam content
    const course = await TutorCourse.findOne({
      _id: courseId,
      status: "approved",
    })
      .select("chapters coursename contentduration")
      .populate({
        path: "chapters.exam",
        model: "ExamQuestion",
        select: "examinationName subject totalMarks examQuestions chapterTitle",
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Approved tutor course not found",
      });
    }

    // Structure the content response
    const content = {
      courseId: course._id,
      courseName: course.coursename,
      contentDuration: course.contentduration,
      chapters: course.chapters.map((chapter) => ({
        chapterId: chapter._id,
        title: chapter.title,
        lessons: chapter.lessons.map((lesson) => ({
          lessonId: lesson._id,
          lessonName: lesson.lessonname,
          audioFiles: lesson.audioFile || [],
          videoFiles: lesson.videoFile || [],
          pdfFiles: lesson.pdfFile || [],
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,
        })),
        exam: chapter.exam || null,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
      })),
    };

    return res.status(200).json({
      success: true,
      message: "Tutor course content fetched successfully",
      data: content,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching tutor course content",
      error: error.message,
    });
  }
};
