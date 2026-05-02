import api, { API_URL } from '../Utils/api.js';
import { secureStorage } from './security';

// Blog API base path - backend mounts blog routes at /api/blog
const BLOG_BASE = '/api/blog';

// Use the centralized api instance (inherits baseURL and interceptors)
const blogApi = api;

// Public blog API uses the same centralized instance
const publicBlogApi = api;

// Note: Token is now managed via httpOnly cookies in the api.js interceptor
// No need for additional bearer token handling here

// Authentication helpers use your existing login system
// No separate blog login needed - admins use the main admin login

export const isAdminLoggedIn = () => {
  // Check role (no token validation needed — cookies are httpOnly)
  const role = secureStorage.getItem('role');
  // Check for lowercase admin roles as per your system
  return !!(role === 'admin' || role === 'superadmin'|| role === 'user');
};

export const getAdminInfo = () => {
  return {
    role: secureStorage.getItem('role'),
    name: secureStorage.getItem('name'),
    email: secureStorage.getItem('email')
  };
};

// Admin Blog Management - send JSON so backend receives req.body correctly
export const createBlog = async (formData) => {
  try {
    const response = await blogApi.post(`${BLOG_BASE}/admin/create`, formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBlog = async (id, formData) => {
  try {
    const response = await blogApi.put(`${BLOG_BASE}/admin/update/${id}`, formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteBlog = async (id) => {
  try {
    const response = await blogApi.delete(`${BLOG_BASE}/admin/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllBlogsAdmin = async () => {
  try {
    const response = await publicBlogApi.get(`${BLOG_BASE}/admin/all`);
    return response.data;
  } catch (error) {
    console.error('Error in getAllBlogsAdmin:', error.message);
    throw error.response?.data || error;
  }
};

// Public Blog APIs (no authentication required)
export const getPublishedBlogs = async () => {
  try {
    const response = await publicBlogApi.get(`${BLOG_BASE}/published`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBlogById = async (id) => {
  try {
    const response = await publicBlogApi.get(`${BLOG_BASE}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const searchBlogs = async (query) => {
  try {
    const response = await publicBlogApi.get(`${BLOG_BASE}/search`, { params: query });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('data:image/')) return imagePath; // Base64 image
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_URL}${imagePath}`;
};

export default blogApi;
