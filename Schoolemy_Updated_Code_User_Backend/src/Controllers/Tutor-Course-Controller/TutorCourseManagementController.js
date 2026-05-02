import { logger } from "../Utils/logger.js";



import mongoose from "mongoose";
import TutorCourse from "../../Models/Tutor-Course/Tutor-course-model.js";


async function verifyTutorCourseOwnership(courseId, tutorId, res) {
  try {
    // SECURITY FIX 3.37.1: Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
      return null;
    }

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      res.status(400).json({
        success: false,
        message: "Invalid tutor ID format",
      });
      return null;
    }


    const course = await TutorCourse.findById(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return null;
    }


    const courseOwnerId = course.tutor.toString();
    const requestingTutorId = tutorId.toString();

    if (courseOwnerId !== requestingTutorId) {
      // Log unauthorized access attempt for security audit
      logger.error(
        `[Security] Unauthorized access attempt: User ${requestingTutorId} tried to access course ${courseId} owned by ${courseOwnerId}`,
      );

      res.status(403).json({
        success: false,
        message: "You do not have permission to access this course",
      });
      return null;
    }

    return course;
  } catch (error) {
    logger.error("[TutorCourseManagement] Ownership verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while verifying course ownership",
    });
    return null;
  }
}


export const getTutorCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.user.id || req.user._id;


    const course = await verifyTutorCourseOwnership(courseId, tutorId, res);
    if (!course) return; // Ownership check failed, response already sent


    const enrolledStudents = course.enrolledStudents || [];

    return res.status(200).json({
      success: true,
      message: "Course students fetched successfully",
      data: {
        courseId: course._id,
        courseName: course.coursename,
        totalStudents: enrolledStudents.length,
        students: enrolledStudents,
      },
    });
  } catch (error) {
    logger.error("[TutorCourseManagement] Error fetching students:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course students",
    });
  }
};


export const getTutorCoursePerformance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.user.id || req.user._id;


    const course = await verifyTutorCourseOwnership(courseId, tutorId, res);
    if (!course) return; // Ownership check failed, response already sent


    const performanceMetrics = {
      totalAssignments: course.chapters?.length || 0,
      averageCompletion: 0,
      studentProgress: [],
    };

    return res.status(200).json({
      success: true,
      message: "Course performance metrics fetched successfully",
      data: {
        courseId: course._id,
        courseName: course.coursename,
        metrics: performanceMetrics,
      },
    });
  } catch (error) {
    logger.error("[TutorCourseManagement] Error fetching performance:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course performance",
    });
  }
};


export const getTutorCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.user.id || req.user._id;


    const course = await verifyTutorCourseOwnership(courseId, tutorId, res);
    if (!course) return; // Ownership check failed, response already sent

    return res.status(200).json({
      success: true,
      message: "Course details fetched successfully",
      data: course,
    });
  } catch (error) {
    logger.error("[TutorCourseManagement] Error fetching details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course details",
    });
  }
};


export const getTutorCourseMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.user.id || req.user._id;


    const course = await verifyTutorCourseOwnership(courseId, tutorId, res);
    if (!course) return; // Ownership check failed, response already sent

    // Extract materials from course
    const materials = course.chapters?.flatMap((chapter) =>
      chapter.lessons?.flatMap((lesson) => [
        ...(lesson.videoFile || []),
        ...(lesson.audioFile || []),
        ...(lesson.pdfFile || []),
      ]),
    ) || [];

    return res.status(200).json({
      success: true,
      message: "Course materials fetched successfully",
      data: {
        courseId: course._id,
        courseName: course.coursename,
        materials,
      },
    });
  } catch (error) {
    logger.error("[TutorCourseManagement] Error fetching materials:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course materials",
    });
  }
};


export const getTutorCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.user.id || req.user._id;


    const course = await verifyTutorCourseOwnership(courseId, tutorId, res);
    if (!course) return; // Ownership check failed, response already sent

    // Extract assignments from course structure
    const assignments = course.chapters?.flatMap((chapter) => ({
      chapterId: chapter._id,
      chapterTitle: chapter.title,
      exam: chapter.exam || null,
    })) || [];

    return res.status(200).json({
      success: true,
      message: "Course assignments fetched successfully",
      data: {
        courseId: course._id,
        courseName: course.coursename,
        assignments,
      },
    });
  } catch (error) {
    logger.error("[TutorCourseManagement] Error fetching assignments:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course assignments",
    });
  }
};


export const updateTutorCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.user.id || req.user._id;
    const updateData = req.body;


    const course = await verifyTutorCourseOwnership(courseId, tutorId, res);
    if (!course) return; // Ownership check failed, response already sent


    delete updateData.tutor; // Can't change course owner
    delete updateData._id; // Can't change ID
    delete updateData.createdAt; // Can't modify creation date
    delete updateData.status; // Should use separate endpoint for status changes

    // Update the course
    const updatedCourse = await TutorCourse.findByIdAndUpdate(
      courseId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    // SECURITY FIX 3.37.1: Log update for audit trail
    logger.debug(`[Audit] Tutor ${tutorId} updated course ${courseId}`);

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    logger.error("[TutorCourseManagement] Error updating course:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating course",
    });
  }
};

export const deleteTutorCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.user.id || req.user._id;


    const course = await verifyTutorCourseOwnership(courseId, tutorId, res);
    if (!course) return; // Ownership check failed, response already sent

    // Delete the course
    await TutorCourse.findByIdAndDelete(courseId);


    logger.debug(`[Audit] Tutor ${tutorId} deleted course ${courseId}`);

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: { deletedCourseId: courseId },
    });
  } catch (error) {
    logger.error("[TutorCourseManagement] Error deleting course:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting course",
    });
  }
};


export const getMyTutorCourses = async (req, res) => {
  try {
    const tutorId = req.user.id || req.user._id;


    const courses = await TutorCourse.find({ tutor: tutorId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "My tutor courses fetched successfully",
      data: courses,
    });
  } catch (error) {
    logger.error("[TutorCourseManagement] Error fetching my courses:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching your courses",
    });
  }
};

export default {
  getTutorCourseStudents,
  getTutorCoursePerformance,
  getTutorCourseDetails,
  getTutorCourseMaterials,
  getTutorCourseAssignments,
  updateTutorCourse,
  deleteTutorCourse,
  getMyTutorCourses,
};
