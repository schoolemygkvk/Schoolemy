import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  createBlog,
  getAllBlogsAdmin,
  getPublishedBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  searchBlogs
} from '../../Controllers/Blog/BlogController.js';

import { verifyToken } from '../../Middleware/authMiddleware.js';
import verifyBlogAdmin from '../../Middleware/blogAuthMiddleware.js';

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) return cb(null, true);
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
};

// Store file in memory for S3 upload (no disk path)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// NOTE: Blog admin routes use existing admin authentication
// Admins login through the main /adminlogin route
// The verifyToken middleware handles JWT authentication and attaches req.user
// The verifyBlogAdmin middleware only checks if user.role is 'Admin'

// Admin Blog Management Routes (Protected - requires existing admin login)
router.post('/admin/create', verifyToken, verifyBlogAdmin, upload.single('image'), createBlog);
router.get('/admin/all', getAllBlogsAdmin);
router.put('/admin/update/:id', verifyToken, verifyBlogAdmin, upload.single('image'), updateBlog);
router.delete('/admin/delete/:id', verifyToken, verifyBlogAdmin, deleteBlog);

// Debug endpoint to test authentication
router.get('/admin/test-auth', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication working',
    user: req.user
  });
});

// Public Blog Routes
router.get('/published', getPublishedBlogs);
router.get('/search', searchBlogs);
router.get('/:id', getBlogById);

export default router;
