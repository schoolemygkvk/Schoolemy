import { PutObjectCommand } from '@aws-sdk/client-s3';
import Blog from '../../Models/Blog/BlogModel.js';
import s3 from '../../DB/adudios3.js';

const BLOG_BUCKET = process.env.AWS_S3_STAFF_BUCKET || process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

async function uploadBlogImageToS3(buffer, mimeType, originalName) {
  if (!BLOG_BUCKET) throw new Error('AWS_S3_STAFF_BUCKET or AWS_BUCKET_NAME is not configured in .env');
  const ext = (originalName && originalName.split('.').pop()) || (mimeType && mimeType.split('/')[1]) || 'jpg';
  const key = `blogs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: BLOG_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType || 'image/jpeg',
  });
  await s3.send(command);
  return `https://${BLOG_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

// @desc    Create a new blog (image: file upload → S3 URL, or legacy base64)
// @route   POST /api/blog/admin/create
// @access  Private (Admin)
const createBlog = async (req, res) => {
  try {
    const { title, excerpt, content, author, tags, published, image } = req.body;

    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    const blogData = {
      title,
      excerpt,
      content,
      author: author || 'Admin',
      tags: parsedTags || [],
      published: published === 'true' || published === true
    };

    if (req.file && req.file.buffer) {
      blogData.image = await uploadBlogImageToS3(req.file.buffer, req.file.mimetype, req.file.originalname);
    } else if (image && image.startsWith('data:image/')) {
      blogData.image = image;
    }

    const blog = await Blog.create(blogData);

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating blog',
      error: error.message
    });
  }
};

// @desc    Get all blogs (admin can see unpublished)
// @route   GET /api/blog/admin/all
// @access  Private (Admin)
const getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message
    });
  }
};

// @desc    Get all published blogs (public)
// @route   GET /api/blog/published
// @access  Public
const getPublishedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Get published blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching published blogs',
      error: error.message
    });
  }
};

// @desc    Get single blog by ID
// @route   GET /api/blog/:id
// @access  Public
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog',
      error: error.message
    });
  }
};

// @desc    Update blog (image: file upload → S3 URL, or legacy base64 / clear)
// @route   PUT /api/blog/admin/update/:id
// @access  Private (Admin)
// FormData sends all fields as strings; multer puts them in req.body
const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const body = req.body || {};

    if (body.title !== undefined) blog.title = body.title;
    if (body.excerpt !== undefined) blog.excerpt = body.excerpt;
    if (body.content !== undefined) blog.content = body.content;
    if (body.author !== undefined) blog.author = body.author;

    if (body.tags !== undefined) {
      const parsed = typeof body.tags === 'string'
        ? body.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : body.tags;
      blog.tags = Array.isArray(parsed) ? parsed : blog.tags;
    }

    if (body.published !== undefined) {
      blog.published = body.published === 'true' || body.published === true;
    }

    if (req.file && req.file.buffer) {
      blog.image = await uploadBlogImageToS3(req.file.buffer, req.file.mimetype, req.file.originalname);
    } else if (body.image !== undefined) {
      if (typeof body.image === 'string' && body.image.startsWith('data:image/')) blog.image = body.image;
      else if (body.image === '') blog.image = '';
    }

    const updatedBlog = await blog.save();

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    const message = error.message || 'Error updating blog';
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({
      success: false,
      message,
      error: message
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blog/admin/delete/:id
// @access  Private (Admin)
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // No need to delete files since we're using Base64 images
    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting blog',
      error: error.message
    });
  }
};

// @desc    Search blogs by tag or keyword
// @route   GET /api/blog/search?q=keyword&tag=tagname
// @access  Public
const searchBlogs = async (req, res) => {
  try {
    const { q, tag } = req.query;
    let query = { published: true };

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Search blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching blogs',
      error: error.message
    });
  }
};

export {
  createBlog,
  getAllBlogsAdmin,
  getPublishedBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  searchBlogs
};
