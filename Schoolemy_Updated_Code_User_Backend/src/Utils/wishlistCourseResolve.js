import mongoose from "mongoose";
import Course from "../Models/Course-Model/Course-Model.js";
import TutorCourse from "../Models/Tutor-Course/Tutor-course-model.js";

const SELECT_FIELDS =
  "title coursename thumbnail category price instructor rating level status";


export async function resolveWishlistCourse(courseId) {
  if (!courseId || !mongoose.Types.ObjectId.isValid(String(courseId))) {
    return null;
  }

  const sid = String(courseId);

  const platform = await Course.findById(sid).select(SELECT_FIELDS);
  if (platform) {
    return { doc: platform, isTutorCourse: false };
  }

  const tutor = await TutorCourse.findOne({
    _id: sid,
    status: "approved",
  }).select(SELECT_FIELDS);

  if (tutor) {
    return { doc: tutor, isTutorCourse: true };
  }

  return null;
}

export function buildWishlistSnapshot(doc, isTutorCourse) {
  return {
    title: doc.title || doc.coursename,
    coursename: doc.coursename,
    thumbnail: doc.thumbnail,
    category: doc.category,
    price: {
      amount: doc.price?.amount,
      finalPrice: doc.price?.finalPrice,
    },
    instructor:
      typeof doc.instructor === "object"
        ? doc.instructor?.name
        : doc.instructor,
    rating: doc.rating,
    level: doc.level,
    isTutorCourse: !!isTutorCourse,
  };
}
