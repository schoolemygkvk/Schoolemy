import api from "./api";

const API_BASE = api.defaults.baseURL || "";

/**
 * Resolve image URL from dashboard API. Use for any image path returned by the API
 * so that relative paths work correctly on page refresh (all routes).
 * @param {string} path - Image path from API (e.g. "/uploads/hero.jpg" or "uploads/hero.jpg")
 * @returns {string} Absolute URL or original path if already absolute
 */
export const getDashboardImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  return API_BASE + (path.startsWith("/") ? path : "/" + path);
};

/**
 * Get top banner section with slides
 * @returns {Promise<{ success: boolean, data: { slides: Array } }>}
 */
export const getTopBannerSection = async () => {
  try {
    const response = await api.get("/top-banner");
    return response.data;
  } catch (error) {
    console.error("Error fetching top banner section:", error);
    throw error;
  }
};

/**
 * Get hero section content
 * @returns {Promise<{ success: boolean, data: { eyebrow, headline, description, mainImage, primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, cardTop, cardBottom } }>}
 */
export const getHeroSection = async () => {
  try {
    const response = await api.get("/hero");
    return response.data;
  } catch (error) {
    console.error("Error fetching hero section:", error);
    throw error;
  }
};

/**
 * Get courses section with courses
 * @returns {Promise<{ success: boolean, data: { sectionTitle: string, courses: Array<{ title: string, image: string, category: string }> } }>}
 */
export const getCoursesSection = async () => {
  try {
    const response = await api.get("/courses");
    return response.data;
  } catch (error) {
    console.error("Error fetching courses section:", error);
    throw error;
  }
};

/**
 * Get category section (homepage category carousel)
 * @returns {Promise<{ success: boolean, data: { sectionTitle: string, categories: Array<{ title: string, image: string, color: string, bgColor: string }> } }>}
 */
export const getCategorySection = async () => {
  try {
    const response = await api.get("/categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching category section:", error);
    throw error;
  }
};

/**
 * Get demo video section
 * @returns {Promise<{ success: boolean, data: { title, subtitle, videoThumbnail, videoUrl, statsTitle, buttonText, buttonLink, metrics, review } }>}
 */
export const getDemoVideoSection = async () => {
  try {
    const response = await api.get("/demo-video");
    return response.data;
  } catch (error) {
    console.error("Error fetching demo video section:", error);
    throw error;
  }
};

/**
 * Get why choose us section
 * @returns {Promise<{ success: boolean, data: { title: string, image: string, features: string[] } }>}
 */
export const getWhyChooseUsSection = async () => {
  try {
    const response = await api.get("/why-choose-us");
    return response.data;
  } catch (error) {
    console.error("Error fetching why choose us section:", error);
    throw error;
  }
};

/**
 * Get CTA section with title, subtitle, and subjects
 * @returns {Promise<{ success: boolean, data: { title: string, subtitle: string, subjects: Array<{ title: string, description: string, color: string, gradient: string, icon: string }> } }>}
 */
export const getCtaSection = async () => {
  try {
    const response = await api.get("/cta");
    return response.data;
  } catch (error) {
    console.error("Error fetching CTA section:", error);
    throw error;
  }
};

/**
 * Get What We Offer section
 * @returns {Promise<{ success: boolean, data: { title: string, description: string, buttonText: string, buttonLink: string, offerings: Array<{ title: string, icon: string, link: string }> } }>}
 */
export const getWhatWeOfferSection = async () => {
  try {
    const response = await api.get("/what-we-offer");
    return response.data;
  } catch (error) {
    console.error("Error fetching what we offer section:", error);
    throw error;
  }
};

/**
 * Get Feedback section
 * @returns {Promise<{ success: boolean, data: { badgeText: string, title: string, subtitle: string, stats: Array<{ value: string, label: string }>, testimonials: Array<{ name: string, role: string, avatar: string, rating: number, text: string }> } }>}
 */
export const getFeedbackSection = async () => {
  try {
    const response = await api.get("/feedback");
    return response.data;
  } catch (error) {
    console.error("Error fetching feedback section:", error);
    throw error;
  }
};

/**
 * Get all staff with pagination
 * @param {Object} params - { page: number, limit: number }
 * @returns {Promise<{ success: boolean, staff: Array, pagination: { total, page, pages, limit } }>}
 */
export const getAllStaff = async (params = {}) => {
  try {
    const response = await api.get("/staff-details", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching staff:", error);
    throw error;
  }
};
