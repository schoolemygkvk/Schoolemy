// Migration: Rename enrolledCourses.coursename to enrolledCourses.courseName
// Run before deploying B9 fix to production

import mongoose from "mongoose";

export const up = async (db) => {
  try {
    const result = await db.collection("users").updateMany(
      { "enrolledCourses.coursename": { $exists: true } },
      [
        {
          $set: {
            enrolledCourses: {
              $map: {
                input: "$enrolledCourses",
                as: "course",
                in: {
                  course: "$$course.course",
                  courseName: {
                    $ifNull: ["$$course.courseName", "$$course.coursename"]
                  },
                  emiPlan: "$$course.emiPlan",
                  accessStatus: "$$course.accessStatus"
                }
              }
            }
          }
        }
      ]
    );

    return { success: true, modifiedCount: result.modifiedCount };
  } catch (error) {
    throw error;
  }
};

export const down = async (db) => {
  // Rollback: Not recommended - would lose data
};
