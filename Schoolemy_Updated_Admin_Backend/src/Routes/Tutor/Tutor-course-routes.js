import express from "express";
import multer from "multer";
import {
  createCourse,
  createCourseWithS3UrlsForTutor,
  getCourseNames,
  getCourseByName,
  updateCourse,
  updateCourseWithS3UrlsForTutor,
  getCoursesByCategory,
  getCoursesByTutor,
  getCoursesByTutorname
} from "../../Controllers/Tutor/Tutor-coure-controller.js";

// Initialize router
const router = express.Router();

// Multer config: store uploaded files in memory
const upload = multer({ storage: multer.memoryStorage() });

// POST - Create course with S3 URLs (RECOMMENDED - bypasses API Gateway 10MB limit)
router.post("/createcourses-tutors-with-s3-urls", createCourseWithS3UrlsForTutor);

// POST - Create a new course with multimedia files (LEGACY - limited to 10MB on API Gateway)
router.post("/createcourses-tutors", upload.any(), createCourse);

// GET - Retrieve courses name
router.get("/getcourses-tutors", getCourseNames );

// GET - Retrieve courses
router.get("/courses-tutors/:coursename", getCourseByName);

// PUT - Update course with S3 URLs (RECOMMENDED - bypasses API Gateway 10MB limit)
router.put("/course-tutors/update-with-s3-urls/:coursename", updateCourseWithS3UrlsForTutor);

// PUT - Update course with multipart (LEGACY - limited to 10MB on API Gateway)
router.put("/course-tutors/update/:coursename", upload.any(), updateCourse);

// GET - Retrieve courses by category
router.get("/courses-tutors/category/:categoryName", getCoursesByCategory);

// GET - Retrieve courses for authenticated tutor (use token)
router.get("/courses-tutors", getCoursesByTutor);

// GET - Retrieve courses by tutor name (without authentication)
router.get("/courses-tutors/tutor/:tutorname", getCoursesByTutorname);

export default router;
