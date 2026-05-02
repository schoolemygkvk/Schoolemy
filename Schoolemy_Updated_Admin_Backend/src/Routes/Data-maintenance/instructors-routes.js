import express from 'express';
import multer from 'multer';
import { createInstructor, getAllInstructors, updateInstructor, updateInstructorImage, removeInstructorImage, deleteInstructor, seedSampleInstructors, clearAllInstructors, diagnosticCheck } from '../../Controllers/Data-Maintenance/instructors.js';

const router = express.Router();

// Multer: accepts FormData with optional image file (field name: image)
// Also parses text fields into req.body. Supports profilePictureBase64 OR file in image field
const storage = multer.memoryStorage();
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};
const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Create - FormData with image file OR profilePictureBase64 (both use same S3 flow)
router.post('/post-create-instructor', upload.single('image'), createInstructor);

// Get all instructors with pagination
router.get('/get-instructors-all', getAllInstructors);

// Update - FormData with optional image file OR profilePictureBase64
router.put('/update-instructor/:id', upload.single('image'), updateInstructor);

// Update image only - FormData with image file OR profilePictureBase64
router.put('/update-instructor/:id/image', upload.single('image'), updateInstructorImage);

// Remove instructor image only
router.delete('/remove-instructor/:id/image', removeInstructorImage);

// Delete instructor
router.delete('/delete-instructor/:id', deleteInstructor);

// Seed sample instructors (development/demo only)
router.post('/seed-sample', seedSampleInstructors);

// Clear all instructors (development/demo only)
router.delete('/clear-all', clearAllInstructors);

// Diagnostic check (see what's in database)
router.get('/diagnostic', diagnosticCheck);

export default router;
