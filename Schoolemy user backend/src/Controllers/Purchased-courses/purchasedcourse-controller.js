import Payment from "../../Models/Payment-Model/Payment-Model.js";
import User from "../../Models/User-Model/User-Model.js";
import TutorCourse from "../../Models/Tutor-Course/Tutor-course-model.js";

export const getPurchasedCoursesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    // First, check if user has created tutor courses
    const tutorCourses = await TutorCourse.find({
      tutor: userId,
      status: "approved",
    }).select(
      "CourseMotherId coursename thumbnail previewvedio price level instructor courseduration contentduration",
    );

    if (tutorCourses.length > 0) {
      // User is a tutor, return their created courses
      const mappedTutorCourses = tutorCourses.map((course) => ({
        courseId: course._id,
        CourseMotherId: course.CourseMotherId,
        coursename: course.coursename,
        thumbnail: course.thumbnail,
        previewvedio: course.previewvedio,
        price: course.price,
        level: course.level,
        instructor: course.instructor,
        courseduration: course.courseduration,
        contentduration: {
          hours: course.contentduration?.hours || 0,
          minutes: course.contentduration?.minutes || 0,
        },
        formattedDuration: `${course.contentduration?.hours || 0}h ${course.contentduration?.minutes || 0}min`,
        isTutorCourse: true,
        progress: 100, // Tutors have 100% progress on their own courses
      }));

      return res.status(200).json({
        success: true,
        count: mappedTutorCourses.length,
        data: mappedTutorCourses,
      });
    } else {
      // User is a student, return purchased courses (both regular courses and tutor courses)
      const payments = await Payment.find({
        userId,
        paymentStatus: "completed",
      })
        .populate(
          "courseId",
          " CourseMotherId coursename thumbnail previewvedio price level instructor courseduration contentduration",
        )
        .populate(
          "tutorCourseId",
          " CourseMotherId coursename thumbnail previewvedio price level instructor courseduration contentduration",
        );

      const purchasedCourses = payments
        .map((payment) => {
          // Handle regular course purchases
          if (payment.courseId) {
            const course = payment.courseId;
            return {
              courseId: course._id,
              CourseMotherId: course.CourseMotherId,
              coursename: course.coursename,
              thumbnail: course.thumbnail,
              previewvedio: course.previewvedio,
              price: course.price,
              level: course.level,
              instructor: course.instructor,
              courseduration: course.courseduration,
              contentduration: {
                hours: course.contentduration?.hours || 0,
                minutes: course.contentduration?.minutes || 0,
              },
              formattedDuration: `${course.contentduration?.hours || 0}h ${course.contentduration?.minutes || 0}min`,
              isTutorCourse: false,
              progress: 0, // Default progress for purchased courses (to be implemented with lesson tracking)
            };
          }
          // Handle tutor course purchases
          else if (payment.tutorCourseId) {
            const course = payment.tutorCourseId;
            return {
              courseId: course._id,
              CourseMotherId: course.CourseMotherId,
              coursename: course.coursename,
              thumbnail: course.thumbnail,
              previewvedio: course.previewvedio,
              price: course.price,
              level: course.level,
              instructor: course.instructor,
              courseduration: course.courseduration,
              contentduration: {
                hours: course.contentduration?.hours || 0,
                minutes: course.contentduration?.minutes || 0,
              },
              formattedDuration: `${course.contentduration?.hours || 0}h ${course.contentduration?.minutes || 0}min`,
              isTutorCourse: true,
              progress: 0, // Default progress for purchased tutor courses (to be implemented with lesson tracking)
            };
          }
          return null;
        })
        .filter(Boolean);

      return res.status(200).json({
        success: true,
        count: purchasedCourses.length,
        data: purchasedCourses,
      });
    }
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Server error" });
  }
};
