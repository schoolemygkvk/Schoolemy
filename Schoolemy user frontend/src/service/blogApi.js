import axios from "axios";

// Use environment variable for blog API, otherwise fall back to AWS Lambda endpoint
const API_URL =
  process.env.REACT_APP_BLOG_API_URL ||
  "https://e3a24h4aa3.execute-api.ap-south-1.amazonaws.com/dev";

// Create axios instance
const blogApi = axios.create({
  baseURL: `${API_URL}/api/blog`,
});

// Add token to requests if available
// Uses the same token from your existing admin login system
blogApi.interceptors.request.use(
  (config) => {
    // Use the same token key as your existing admin system
    const token = localStorage.getItem("token"); // Your existing token key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Authentication helpers use your existing login system
// No separate blog login needed - admins use the main admin login

export const isAdminLoggedIn = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  // Check for lowercase admin roles as per your system
  return !!(token && (role === "admin" || role === "superadmin"));
};

export const getAdminInfo = () => {
  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    name: localStorage.getItem("name"),
    email: localStorage.getItem("email"),
  };
};

// Admin Blog Management
export const createBlog = async (formData) => {
  try {
    const response = await blogApi.post("/admin/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBlog = async (id, formData) => {
  try {
    const response = await blogApi.put(`/admin/update/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteBlog = async (id) => {
  try {
    const response = await blogApi.delete(`/admin/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllBlogsAdmin = async () => {
  try {
    console.log("🔍 Calling getAllBlogsAdmin...");
    console.log(
      "Token:",
      localStorage.getItem("token") ? "Present" : "Missing",
    );
    console.log("Role:", localStorage.getItem("role"));

    const response = await blogApi.get("/admin/all");
    console.log("✅ Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error in getAllBlogsAdmin:", error);
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);
    throw error.response?.data || error;
  }
};

// Public Blog APIs
export const getPublishedBlogs = async () => {
  try {
    const response = await blogApi.get("/published");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBlogById = async (id) => {
  try {
    const response = await blogApi.get(`/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const searchBlogs = async (query) => {
  try {
    const response = await blogApi.get("/search", { params: query });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("data:image/")) return imagePath;
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_URL}${imagePath}`;
};

export default blogApi;
